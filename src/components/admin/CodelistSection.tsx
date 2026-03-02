'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, Globe } from 'lucide-react'
import { getLocaleName } from '@/lib/i18n'
import { formatNumber } from '@/lib/format'
import type { CodelistSectionProps } from './types'

export function CodelistSection({
  title,
  icon: Icon,
  items,
  newName,
  setNewName,
  onAdd,
  onDelete,
  onMove,
  placeholder,
  t,
  locale,
  showPrice,
  newPrice,
  setNewPrice,
  onPriceChange,
  newNameEn,
  setNewNameEn,
  newNameSw,
  setNewNameSw,
  translating,
  onTranslate,
  onUpdateTranslations,
  onNameChange,
}: CodelistSectionProps) {
  const [open, setOpen] = useState(false)
  const [showNewTrans, setShowNewTrans] = useState(false)
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null)
  const [editPriceValue, setEditPriceValue] = useState('')
  const [editingTransId, setEditingTransId] = useState<string | null>(null)
  const [editNameEn, setEditNameEn] = useState('')
  const [editNameSw, setEditNameSw] = useState('')
  const [editingNameId, setEditingNameId] = useState<string | null>(null)
  const [editNameValue, setEditNameValue] = useState('')

  return (
    <div className="bg-white rounded-xl border border-gray-200 card-hover overflow-hidden">
      {/* Tile - clickable card */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-6 h-6 text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight" title={title}>{title}</h3>
          <p className="text-sm text-gray-600">{items.length} {items.length === 1 ? 'polo\u017eka' : items.length >= 2 && items.length <= 4 ? 'polo\u017eky' : 'polo\u017eek'}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {/* Add new item */}
          <div className="mb-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={placeholder}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              />
              <button
                onClick={() => {
                  if (showNewTrans) {
                    setShowNewTrans(false)
                    setNewNameEn('')
                    setNewNameSw('')
                  } else {
                    setShowNewTrans(true)
                    if (newName.trim()) onTranslate()
                  }
                }}
                disabled={translating}
                className={`px-3 py-2.5 rounded-xl border flex-shrink-0 transition-colors flex items-center gap-1.5 ${showNewTrans ? 'border-blue-400 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-500 hover:text-blue-600'} disabled:opacity-30 disabled:cursor-not-allowed`}
                title={t('admin.translate')}
              >
                {translating ? (
                  <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                ) : (
                  <Globe className="w-4 h-4" />
                )}
              </button>
            </div>
            {showPrice && setNewPrice && (
              <input
                type="number"
                value={newPrice || ''}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder={t('admin.priceCZK')}
                className="w-32 px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                onKeyDown={(e) => e.key === 'Enter' && onAdd()}
              />
            )}
            {/* Translation fields */}
            {showNewTrans && (
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 uppercase">EN</span>
                  <input
                    type="text"
                    value={newNameEn}
                    onChange={(e) => setNewNameEn(e.target.value)}
                    placeholder={t('admin.nameEn')}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-blue-200 bg-blue-50/50 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 uppercase">SW</span>
                  <input
                    type="text"
                    value={newNameSw}
                    onChange={(e) => setNewNameSw(e.target.value)}
                    placeholder={t('admin.nameSw')}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-amber-200 bg-amber-50/50 focus:ring-2 focus:ring-amber-400 outline-none text-sm"
                  />
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => { onAdd(); setShowNewTrans(false) }}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" /> {t('app.add')}
              </button>
              {(newName || (showPrice && newPrice) || showNewTrans) && (
                <button
                  onClick={() => { setNewName(''); if (setNewPrice) setNewPrice(''); setNewNameEn(''); setNewNameSw(''); setShowNewTrans(false) }}
                  className="px-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm"
                >
                  {t('app.cancel')}
                </button>
              )}
            </div>
          </div>

          {/* Item list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 rounded-xl border border-gray-100 group">
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        aria-label="Posunout nahoru"
                        onClick={() => onMove(item.id, 'up')}
                        disabled={idx === 0}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        aria-label="Posunout dol\u016f"
                        onClick={() => onMove(item.id, 'down')}
                        disabled={idx === items.length - 1}
                        className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <Icon className="w-5 h-5 text-primary-500" />
                    {editingNameId === item.id ? (
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        onBlur={() => {
                          if (editNameValue.trim() && editNameValue.trim() !== item.name) {
                            onNameChange(item.id, editNameValue.trim())
                          }
                          setEditingNameId(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editNameValue.trim() && editNameValue.trim() !== item.name) {
                              onNameChange(item.id, editNameValue.trim())
                            }
                            setEditingNameId(null)
                          }
                          if (e.key === 'Escape') setEditingNameId(null)
                        }}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-primary-400 dark:border-primary-500 dark:bg-gray-700 dark:text-gray-100 text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                        autoFocus
                      />
                    ) : (
                      <button
                        onClick={() => { setEditingNameId(item.id); setEditNameValue(item.name) }}
                        className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-pointer rounded px-1 -mx-1 hover:bg-primary-50 dark:hover:bg-primary-900/30"
                        title={t('admin.editName')}
                      >
                        {getLocaleName(item, locale)}
                        <Pencil className="w-3 h-3 inline-block ml-1.5 opacity-0 group-hover:opacity-40 dark:group-hover:opacity-60" />
                      </button>
                    )}
                    {showPrice && onPriceChange && (
                      editingPriceId === item.id ? (
                        <input
                          type="number"
                          value={editPriceValue}
                          onChange={(e) => setEditPriceValue(e.target.value)}
                          onBlur={() => {
                            onPriceChange(item.id, editPriceValue ? parseFloat(editPriceValue) : null)
                            setEditingPriceId(null)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onPriceChange(item.id, editPriceValue ? parseFloat(editPriceValue) : null)
                              setEditingPriceId(null)
                            }
                            if (e.key === 'Escape') setEditingPriceId(null)
                          }}
                          className="w-24 px-2 py-1 rounded-lg border border-primary-400 dark:border-primary-500 dark:bg-gray-700 dark:text-gray-100 text-sm text-right focus:ring-2 focus:ring-primary-500 outline-none"
                          autoFocus
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingPriceId(item.id); setEditPriceValue(item.price?.toString() || '') }}
                          className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                          title={t('admin.editPrice')}
                        >
                          {item.price ? `${formatNumber(item.price)} CZK` : t('admin.noPrice')}
                          <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 dark:group-hover:opacity-80" />
                        </button>
                      )
                    )}
                    <button
                      onClick={() => {
                        if (editingTransId === item.id) {
                          setEditingTransId(null)
                        } else {
                          setEditingTransId(item.id)
                          setEditNameEn(item.nameEn || '')
                          setEditNameSw(item.nameSw || '')
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title={t('admin.editTranslations')}
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                    <button
                      aria-label="Smazat"
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Inline translation edit */}
                  {editingTransId === item.id && (
                    <div className="px-4 pb-3 space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 uppercase">EN</span>
                        <input
                          type="text"
                          value={editNameEn}
                          onChange={(e) => setEditNameEn(e.target.value)}
                          placeholder={t('admin.nameEn')}
                          className="w-full pl-10 pr-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateTranslations(item.id, editNameEn || null, editNameSw || null)
                              setEditingTransId(null)
                            }
                            if (e.key === 'Escape') setEditingTransId(null)
                          }}
                          autoFocus
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-600 uppercase">SW</span>
                        <input
                          type="text"
                          value={editNameSw}
                          onChange={(e) => setEditNameSw(e.target.value)}
                          placeholder={t('admin.nameSw')}
                          className="w-full pl-10 pr-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/50 text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateTranslations(item.id, editNameEn || null, editNameSw || null)
                              setEditingTransId(null)
                            }
                            if (e.key === 'Escape') setEditingTransId(null)
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          onUpdateTranslations(item.id, editNameEn || null, editNameSw || null)
                          setEditingTransId(null)
                        }}
                        className="w-full px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700"
                      >
                        {t('app.save')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <Icon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="text-gray-600 text-sm">{t('app.noData')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
