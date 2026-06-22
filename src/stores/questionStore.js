import { create } from 'zustand'
import { BUNDLED_SETS, DEFAULT_BUNDLED_ID, getBundledSet } from '../data/bundledSets.js'
import {
  listQuestionSets,
  loadQuestions,
  saveQuestionSet,
  deleteQuestionSet,
} from '../db/dexie.js'

export const useQuestionStore = create((set, get) => ({
  bundledSets: BUNDLED_SETS,
  sets: [],
  selectedSetId: DEFAULT_BUNDLED_ID,
  activeQuestions: getBundledSet(DEFAULT_BUNDLED_ID).questions,

  async refresh() {
    try {
      const sets = await listQuestionSets()
      set({ sets })
    } catch (e) {
      console.error('문제 세트 목록 로드 실패', e)
    }
  },

  async createSet(name, subject, questions) {
    const id = await saveQuestionSet({ name, subject }, questions)
    await get().refresh()
    return id
  },

  async selectSet(id) {
    // 번들 세트 (문자열 id로 시작하는 'bundled:*')
    if (typeof id === 'string' && id.startsWith('bundled:')) {
      const bundled = getBundledSet(id)
      if (bundled) {
        set({ selectedSetId: id, activeQuestions: bundled.questions })
        return
      }
    }
    // 사용자 업로드 세트 (숫자 id)
    if (id == null) {
      set({
        selectedSetId: DEFAULT_BUNDLED_ID,
        activeQuestions: getBundledSet(DEFAULT_BUNDLED_ID).questions,
      })
      return
    }
    const questions = await loadQuestions(id)
    set({ selectedSetId: id, activeQuestions: questions })
  },

  async deleteSet(id) {
    await deleteQuestionSet(id)
    if (get().selectedSetId === id) {
      set({
        selectedSetId: DEFAULT_BUNDLED_ID,
        activeQuestions: getBundledSet(DEFAULT_BUNDLED_ID).questions,
      })
    }
    await get().refresh()
  },
}))

export const SAMPLE_SET_ID = DEFAULT_BUNDLED_ID
