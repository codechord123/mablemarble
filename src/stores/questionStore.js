import { create } from 'zustand'
import sampleQuestions from '../data/sampleQuestions.json'
import {
  listQuestionSets,
  loadQuestions,
  saveQuestionSet,
  deleteQuestionSet,
} from '../db/dexie.js'

const SAMPLE_ID = 'sample'

export const useQuestionStore = create((set, get) => ({
  sets: [],
  selectedSetId: SAMPLE_ID,
  activeQuestions: sampleQuestions,

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
    if (id === SAMPLE_ID || id == null) {
      set({ selectedSetId: SAMPLE_ID, activeQuestions: sampleQuestions })
      return
    }
    const questions = await loadQuestions(id)
    set({ selectedSetId: id, activeQuestions: questions })
  },

  async deleteSet(id) {
    await deleteQuestionSet(id)
    if (get().selectedSetId === id) {
      set({ selectedSetId: SAMPLE_ID, activeQuestions: sampleQuestions })
    }
    await get().refresh()
  },
}))

export const SAMPLE_SET_ID = SAMPLE_ID
