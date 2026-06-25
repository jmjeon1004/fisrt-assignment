import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Book } from './types'
import './App.css'

function App() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [rating, setRating] = useState(5)
  const [review, setReview] = useState('')
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBooks()
  }, [])

  async function fetchBooks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('불러오기 오류:', error)
    else setBooks(data ?? [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !review.trim()) return

    setSubmitting(true)

    if (editingBook) {
      const { error } = await supabase
        .from('books')
        .update({ title: title.trim(), rating, review: review.trim() })
        .eq('id', editingBook.id)

      if (error) console.error('수정 오류:', error)
      else {
        setEditingBook(null)
        resetForm()
        await fetchBooks()
      }
    } else {
      const { error } = await supabase
        .from('books')
        .insert([{ title: title.trim(), rating, review: review.trim() }])

      if (error) console.error('저장 오류:', error)
      else {
        resetForm()
        await fetchBooks()
      }
    }

    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return

    const { error } = await supabase.from('books').delete().eq('id', id)
    if (error) console.error('삭제 오류:', error)
    else await fetchBooks()
  }

  function handleEdit(book: Book) {
    setEditingBook(book)
    setTitle(book.title)
    setRating(book.rating)
    setReview(book.review)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function resetForm() {
    setTitle('')
    setRating(5)
    setReview('')
  }

  function handleCancel() {
    setEditingBook(null)
    resetForm()
  }

  return (
    <div className="container">
      <h1>📚 독서 기록장</h1>

      <form onSubmit={handleSubmit} className="book-form">
        <h2>{editingBook ? '✏️ 기록 수정' : '📖 새 독서 기록'}</h2>

        <div className="form-group">
          <label htmlFor="title">책 제목</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="책 제목을 입력하세요"
            required
          />
        </div>

        <div className="form-group">
          <label>평점</label>
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`star-btn ${rating >= n ? 'active' : ''}`}
                onClick={() => setRating(n)}
                aria-label={`${n}점`}
              >
                ⭐
              </button>
            ))}
            <span className="rating-label">{rating}점</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="review">한줄평</label>
          <input
            id="review"
            type="text"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="한줄평을 입력하세요"
            required
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '저장 중...' : editingBook ? '수정하기' : '기록하기'}
          </button>
          {editingBook && (
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              취소
            </button>
          )}
        </div>
      </form>

      <div className="book-list">
        <h2>📋 독서 목록 ({books.length}권)</h2>

        {loading ? (
          <p className="loading">불러오는 중...</p>
        ) : books.length === 0 ? (
          <p className="empty">아직 기록된 책이 없습니다. 첫 번째 책을 추가해보세요!</p>
        ) : (
          books.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-info">
                <h3>{book.title}</h3>
                <div className="book-rating">{'⭐'.repeat(book.rating)}</div>
                <p className="book-review">"{book.review}"</p>
                <p className="book-date">
                  {new Date(book.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="book-actions">
                <button className="btn-edit" onClick={() => handleEdit(book)}>
                  수정
                </button>
                <button className="btn-delete" onClick={() => handleDelete(book.id)}>
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default App
