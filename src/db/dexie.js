import Dexie from 'dexie'

export const db = new Dexie('boomarbleDb')

db.version(1).stores({
  questionSets: '++id, name, subject, createdAt',
  questions: '++id, setId, difficulty, type',
})

export async function saveQuestionSet({ name, subject }, questions) {
  return db.transaction('rw', db.questionSets, db.questions, async () => {
    const setId = await db.questionSets.add({
      name: name?.trim() || '이름 없음',
      subject: subject?.trim() || '기타',
      createdAt: Date.now(),
    })
    const withSetId = questions.map((q) => ({ ...q, setId }))
    await db.questions.bulkAdd(withSetId)
    return setId
  })
}

export async function listQuestionSets() {
  const sets = await db.questionSets.orderBy('createdAt').reverse().toArray()
  for (const s of sets) {
    s.count = await db.questions.where({ setId: s.id }).count()
  }
  return sets
}

export async function loadQuestions(setId) {
  return db.questions.where({ setId }).toArray()
}

export async function deleteQuestionSet(setId) {
  return db.transaction('rw', db.questionSets, db.questions, async () => {
    await db.questions.where({ setId }).delete()
    await db.questionSets.delete(setId)
  })
}
