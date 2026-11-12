import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// 폐쇄망이라 글꼴도 번들에 넣는다
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css'
import './styles/index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
