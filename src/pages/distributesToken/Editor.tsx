import { Dispatch, SetStateAction } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

export default function Editor({
  content,
  setContent
}: {
  content: string
  setContent: Dispatch<SetStateAction<string>>
}) {
  return <ReactQuill style={{ height: 320 }} theme="snow" value={content} onChange={setContent} />
}
