import Image from 'next/image'
import { Camera, Upload, Loader2, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/format'

interface PhotosTabProps {
  student: any
  canEditData: boolean
  photoFilter: string
  setPhotoFilter: (v: string) => void
  filteredPhotos: any[]
  showAddPhoto: boolean
  setShowAddPhoto: (v: boolean) => void
  newPhoto: { category: string; description: string; takenAt: string; file: File | null }
  setNewPhoto: (v: any) => void
  addPhoto: () => void
  deletePhoto: (photoId: string) => void
  uploading: boolean
  locale: string  // PhotosTab doesn't use getLocaleName, so string is fine
  t: (key: string) => string
}

export function PhotosTab({
  student, canEditData, photoFilter, setPhotoFilter, filteredPhotos,
  showAddPhoto, setShowAddPhoto, newPhoto, setNewPhoto,
  addPhoto, deletePhoto, uploading, locale, t
}: PhotosTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg"><Camera className="w-4 h-4 text-purple-600 dark:text-purple-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('photos.title')}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">{[{ key:'all',label:t('photos.filterAll') },{ key:'visit',label:t('photos.visit') },{ key:'handover',label:t('photos.handover') },{ key:'voucher',label:t('photos.voucher') }].map(f => <button key={f.key} onClick={() => setPhotoFilter(f.key)} className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${photoFilter === f.key ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{f.label}</button>)}</div>
          {canEditData && <button onClick={() => setShowAddPhoto(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"><Upload className="w-4 h-4" /> {t('photos.upload')}</button>}
        </div>
      </div>
      {showAddPhoto && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <select aria-label="Kategorie fotografie" value={newPhoto.category} onChange={(e) => setNewPhoto({ ...newPhoto, category: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"><option value="visit">{t('photos.visit')}</option><option value="handover">{t('photos.handover')}</option><option value="voucher">{t('photos.voucher')}</option></select>
            <input aria-label="Datum porizeni fotografie" type="date" value={newPhoto.takenAt} onChange={(e) => setNewPhoto({ ...newPhoto, takenAt: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="Popis fotografie" type="text" value={newPhoto.description} onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })} placeholder={t('photos.description')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="Vybrat soubor fotografie" type="file" accept="image/*" onChange={(e) => setNewPhoto({ ...newPhoto, file: e.target.files?.[0] || null })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
          </div>
          <div className="flex gap-2"><button onClick={addPhoto} disabled={!newPhoto.file || uploading} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50">{uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('app.loading')}</> : t('photos.upload')}</button><button onClick={() => setShowAddPhoto(false)} disabled={uploading} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
        </div>
      )}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{filteredPhotos.map((photo: any) => (
          <div key={photo.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600">
            {photo.filePath ? <div className="relative w-full h-48"><Image src={photo.filePath} alt={photo.description || `${student.firstName} ${student.lastName}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" /></div> : <div className="w-full h-48 bg-gray-200 dark:bg-gray-600 flex items-center justify-center"><Camera className="w-12 h-12 text-gray-400 dark:text-gray-500" /></div>}
            <div className="p-3">
              <div className="flex items-start justify-between"><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{photo.description || '-'}</p>{canEditData && <button aria-label="Smazat" onClick={() => deletePhoto(photo.id)} className="p-1 text-gray-400 hover:text-red-500 -mt-1 -mr-1"><Trash2 className="w-4 h-4" /></button>}</div>
              <div className="flex items-center justify-between mt-2"><span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(photo.takenAt, locale)}</span><span className={`badge ${photo.category === 'visit' ? 'badge-green' : photo.category === 'handover' ? 'badge-yellow' : 'badge-red'}`}>{photo.category === 'visit' ? t('photos.visit') : photo.category === 'handover' ? t('photos.handover') : t('photos.voucher')}</span></div>
            </div>
          </div>
        ))}</div>
      ) : <div className="text-center py-12"><Camera className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p className="text-gray-500 dark:text-gray-400">{t('photos.noPhotos')}</p></div>}
    </div>
  )
}
