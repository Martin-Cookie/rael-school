import { HandHeart, Plus, Trash2, Pencil } from 'lucide-react'
import { formatDate } from '@/lib/format'

interface SponsorsTabProps {
  student: any
  canEditData: boolean
  showAddSponsor: boolean
  setShowAddSponsor: (v: boolean) => void
  showSponsorSearch: boolean
  setShowSponsorSearch: (v: boolean) => void
  sponsorSearch: string
  searchSponsors: (query: string) => void
  sponsorResults: any[]
  addExistingSponsor: (sponsorUserId: string) => void
  newSponsor: { firstName: string; lastName: string; email: string; phone: string; startDate: string; notes: string }
  setNewSponsor: (v: any) => void
  addSponsor: () => void
  removeSponsor: (sponsorshipId: string) => void
  editingSponsor: string | null
  setEditingSponsor: (v: string | null) => void
  editSponsorData: any
  setEditSponsorData: (v: any) => void
  saveSponsorEdit: (sponsorshipId: string, sponsorUserId: string) => void
  locale: string  // SponsorsTab doesn't use getLocaleName, so string is fine
  t: (key: string) => string
}

export function SponsorsTab({
  student, canEditData, showAddSponsor, setShowAddSponsor,
  showSponsorSearch, setShowSponsorSearch, sponsorSearch, searchSponsors,
  sponsorResults, addExistingSponsor, newSponsor, setNewSponsor,
  addSponsor, removeSponsor, editingSponsor, setEditingSponsor,
  editSponsorData, setEditSponsorData, saveSponsorEdit, locale, t
}: SponsorsTabProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent-50 dark:bg-accent-900/30 rounded-lg"><HandHeart className="w-4 h-4 text-accent-600 dark:text-accent-400" /></div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{t('sponsors.title')}</h3>
        </div>
        {canEditData && <button onClick={() => setShowAddSponsor(true)} className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"><Plus className="w-4 h-4" /> {t('sponsors.addSponsor')}</button>}
      </div>
      {/* Search existing sponsor */}
      {canEditData && (
        <div className="mb-4">
          <button
            onClick={() => setShowSponsorSearch(!showSponsorSearch)}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium mb-2"
          >
            {showSponsorSearch ? '\u2715 ' : '\uD83D\uDD0D '}{t('sponsorPage.searchExisting')}
          </button>
          {showSponsorSearch && (
            <div className="relative">
              <input
                aria-label="Hledat sponzora"
                type="text"
                value={sponsorSearch}
                onChange={(e) => searchSponsors(e.target.value)}
                placeholder={t('sponsorPage.searchByName')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none text-sm"
              />
              {sponsorResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto">
                  {sponsorResults.map((sr: any) => (
                    <button
                      key={sr.id}
                      onClick={() => addExistingSponsor(sr.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-sm border-b border-gray-100 dark:border-gray-700 last:border-0"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">{sr.lastName} {sr.firstName}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">{sr.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {showAddSponsor && (
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Vyplnte udaje sponzora. Pokud v systemu neexistuje, bude vytvoren.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input aria-label="Jmeno sponzora" type="text" value={newSponsor.firstName} onChange={(e) => setNewSponsor({ ...newSponsor, firstName: e.target.value })} placeholder={t('student.firstName') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="Prijmeni sponzora" type="text" value={newSponsor.lastName} onChange={(e) => setNewSponsor({ ...newSponsor, lastName: e.target.value })} placeholder={t('student.lastName') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="E-mail sponzora" type="email" value={newSponsor.email} onChange={(e) => setNewSponsor({ ...newSponsor, email: e.target.value })} placeholder={t('sponsors.email') + ' *'} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="Telefon sponzora" type="text" value={newSponsor.phone} onChange={(e) => setNewSponsor({ ...newSponsor, phone: e.target.value })} placeholder={t('sponsors.phone')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="Datum zahajeni sponzorstvi" type="date" value={newSponsor.startDate} onChange={(e) => setNewSponsor({ ...newSponsor, startDate: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
            <input aria-label="Poznamky ke sponzorovi" type="text" value={newSponsor.notes} onChange={(e) => setNewSponsor({ ...newSponsor, notes: e.target.value })} placeholder={t('sponsors.notes')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
          </div>
          <div className="flex gap-2"><button onClick={addSponsor} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.add')}</button><button onClick={() => setShowAddSponsor(false)} className="px-3 py-2 text-gray-500 text-sm">{t('app.cancel')}</button></div>
        </div>
      )}
      {student.sponsorships?.length > 0 ? (
        <div className="space-y-4">{student.sponsorships.map((sp: any) => (
          <div key={sp.id} className="bg-accent-50 dark:bg-accent-900/20 rounded-xl p-5 border border-accent-200 dark:border-accent-800">
            {editingSponsor === sp.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input aria-label="Jmeno sponzora" type="text" value={editSponsorData.firstName || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, firstName: e.target.value })} placeholder={t('student.firstName')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
                  <input aria-label="Prijmeni sponzora" type="text" value={editSponsorData.lastName || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, lastName: e.target.value })} placeholder={t('student.lastName')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
                  <input aria-label="E-mail sponzora" type="email" value={editSponsorData.email || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, email: e.target.value })} placeholder={t('sponsors.email')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 outline-none" />
                  <input aria-label="Telefon sponzora" type="text" value={editSponsorData.phone || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, phone: e.target.value })} placeholder={t('sponsors.phone')} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" />
                  <div className="sm:col-span-2"><input aria-label="Poznamky ke sponzorovi" type="text" value={editSponsorData.notes || ''} onChange={(e) => setEditSponsorData({ ...editSponsorData, notes: e.target.value })} placeholder={t('sponsors.notes')} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm" /></div>
                </div>
                <div className="flex gap-2"><button onClick={() => saveSponsorEdit(sp.id, sp.sponsor.id)} className="px-3 py-1.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700">{t('app.save')}</button><button onClick={() => setEditingSponsor(null)} className="px-3 py-1.5 text-gray-500 text-sm">{t('app.cancel')}</button></div>
              </div>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-accent-200 dark:bg-accent-800 rounded-full flex items-center justify-center flex-shrink-0"><HandHeart className="w-5 h-5 text-accent-700 dark:text-accent-300" /></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100">{sp.sponsor.firstName} {sp.sponsor.lastName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{sp.sponsor.email}</p>
                  {sp.sponsor.phone && <p className="text-sm text-gray-600 dark:text-gray-400">{sp.sponsor.phone}</p>}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t('sponsors.startDate')}: {formatDate(sp.startDate, locale)}</p>
                  {canEditData && <button onClick={() => removeSponsor(sp.id)} className="mt-2 flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium"><Trash2 className="w-3 h-3" /> {t('sponsors.removeSponsor')}</button>}
                  {sp.notes && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">{sp.notes}</p>}
                  <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${sp.isActive ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>{sp.isActive ? '\u25CF Active' : '\u25CB Inactive'}</span>
                </div>
                {canEditData && <button aria-label="Upravit" onClick={() => { setEditingSponsor(sp.id); setEditSponsorData({ firstName: sp.sponsor.firstName, lastName: sp.sponsor.lastName, email: sp.sponsor.email, phone: sp.sponsor.phone || '', notes: sp.notes || '' }) }} className="p-2 text-gray-400 hover:text-gray-600"><Pencil className="w-4 h-4" /></button>}
              </div>
            )}
          </div>
        ))}</div>
      ) : <div className="text-center py-12"><HandHeart className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" /><p className="text-gray-500 dark:text-gray-400">{t('sponsors.noSponsors')}</p></div>}
    </div>
  )
}
