import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { RecipesProvider } from './context/RecipesContext'
import { TimerProvider } from './context/TimerContext'
import { Layout } from './components/Layout'
import { TimerHud } from './components/TimerHud'
import { CookbookPage } from './pages/CookbookPage'
import { RecipePage } from './pages/RecipePage'
import { BakeModePage } from './pages/BakeModePage'
import { NotesPage } from './pages/NotesPage'
import { RecipeEditPage } from './pages/RecipeEditPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <RecipesProvider>
      <TimerProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<CookbookPage />} />
              <Route path="/new" element={<RecipeEditPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/recipe/:id" element={<RecipePage />} />
              <Route path="/recipe/:id/notes" element={<NotesPage />} />
              <Route path="/recipe/:id/edit" element={<RecipeEditPage />} />
            </Route>
            {/* Bake mode is full-screen — intentionally outside the app chrome. */}
            <Route path="/recipe/:id/bake" element={<BakeModePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <TimerHud />
        </HashRouter>
      </TimerProvider>
    </RecipesProvider>
  )
}
