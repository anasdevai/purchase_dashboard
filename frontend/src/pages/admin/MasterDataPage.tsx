import { useEffect, useState, Fragment } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Smartphone,
  Wrench,
  X
} from 'lucide-react';
import { useAppConfirm } from '../../components/common/ConfirmDialogProvider';
import * as api from '../../api/masterData';
import { useLanguage } from '../../i18n/LanguageProvider';
import type {
  Brand,
  DeviceType,
  Model,
  RepairType,
  PriceList,
  RepairCategory,
  DifficultyLevel
} from '../../types/masterData';

const CATEGORIES: RepairCategory[] = [
  'Display',
  'Battery',
  'WaterDamage',
  'Software',
  'LogicBoard',
  'Camera',
  'ChargingPort',
  'Keyboard',
  'Other'
];

type TabName = 'brands' | 'deviceTypes' | 'models' | 'repairTypes' | 'priceLists';

export function MasterDataPage() {
  const { confirm, showToast } = useAppConfirm();
  const { language } = useLanguage();
  const isDe = language === 'de';

  const [activeTab, setActiveTab] = useState<TabName>('brands');

  // Master lists
  const [brands, setBrands] = useState<Brand[]>([]);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [repairTypes, setRepairTypes] = useState<RepairType[]>([]);
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);

  // Loading / Error
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown filter selections
  const [filterBrandId, setFilterBrandId] = useState('');
  const [filterDeviceTypeId, setFilterDeviceTypeId] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields State
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState('');
  const [brandActive, setBrandActive] = useState(true);

  const [deviceTypeName, setDeviceTypeName] = useState('');
  const [deviceTypeBrandId, setDeviceTypeBrandId] = useState('');
  const [deviceTypeActive, setDeviceTypeActive] = useState(true);

  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');
  const [modelDeviceTypeId, setModelDeviceTypeId] = useState('');
  const [modelGen, setModelGen] = useState('');
  const [modelYear, setModelYear] = useState<number | ''>('');
  const [modelStorage, setModelStorage] = useState<string[]>([]);
  const [storageInput, setStorageInput] = useState('');
  const [modelColors, setModelColors] = useState<string[]>([]);
  const [colorsInput, setColorsInput] = useState('');
  const [modelActive, setModelActive] = useState(true);

  const [repairTypeName, setRepairTypeName] = useState('');
  const [repairTypeCat, setRepairTypeCat] = useState<RepairCategory>('Display');
  const [repairTypePrice, setRepairTypePrice] = useState<number | ''>('');
  const [repairTypeDur, setRepairTypeDur] = useState<number | ''>('');
  const [repairTypeDiff, setRepairTypeDiff] = useState<DifficultyLevel | ''>('');
  const [repairTypeActive, setRepairTypeActive] = useState(true);

  const [priceListModelId, setPriceListModelId] = useState('');
  const [priceListRepairId, setPriceListRepairId] = useState('');
  const [priceListVal, setPriceListVal] = useState<number | ''>('');
  const [priceListDur, setPriceListDur] = useState<number | ''>('');
  const [priceListActive, setPriceListActive] = useState(true);

  const t = {
    title: isDe ? 'Geräte & Reparaturen' : 'Master Data',
    subtitle: isDe
      ? 'Zentrale Verwaltung von Marken, Gerätetypen, Modellen, Reparaturarten und der globalen Preisliste.'
      : 'Centralized maintenance of brands, device types, models, repair types, and standard pricing catalog.',
    createNew: isDe ? 'Neu anlegen' : 'Create New',
    tabBrands: isDe ? 'Marken' : 'Brands',
    tabDeviceTypes: isDe ? 'Gerätetypen' : 'Device Types',
    tabModels: isDe ? 'Modelle' : 'Models',
    tabRepairTypes: isDe ? 'Reparaturarten' : 'Repair Types',
    tabPriceLists: isDe ? 'Preislisten' : 'Price Lists',
    searchPlaceholder: isDe ? 'Suchen...' : 'Search...',
    allBrands: isDe ? 'Alle Marken' : 'All Brands',
    allTypes: isDe ? 'Alle Gerätetypen' : 'All Types',
    allCategories: isDe ? 'Alle Kategorien' : 'All Categories',
    
    // Brands list columns
    thBrandName: isDe ? 'Markenname' : 'Brand Name',
    thStatus: isDe ? 'Status' : 'Status',
    thActions: isDe ? 'Aktionen' : 'Actions',
    
    // Device Types list columns
    thType: isDe ? 'Typ' : 'Device Type',
    thBrand: isDe ? 'Marke' : 'Brand',
    
    // Models list columns
    thModel: isDe ? 'Modellname' : 'Model',
    thGeneration: isDe ? 'Generation' : 'Generation',
    thTechSpecs: isDe ? 'Datenblatt' : 'Tech Specs',
    
    // Repair Types list columns
    thRepairType: isDe ? 'Reparaturart' : 'Repair Type',
    thCategory: isDe ? 'Kategorie' : 'Category',
    thStdPrice: isDe ? 'Richtpreis' : 'Std Price',
    thDuration: isDe ? 'Dauer' : 'Duration',
    thDifficulty: isDe ? 'Schwierigkeit' : 'Difficulty',
    
    // Price list columns
    thDeviceModel: isDe ? 'Gerät & Modell' : 'Device & Model',
    thPrice: isDe ? 'Preis' : 'Price',
    thSpecificDuration: isDe ? 'Spezifische Dauer' : 'Duration Override',
    
    // Modals
    editEntry: isDe ? 'Eintrag bearbeiten' : 'Edit Entry',
    createEntry: isDe ? 'Neuen Eintrag anlegen' : 'Create Entry',
    brandNameLabel: isDe ? 'Markenname' : 'Brand Name',
    logoUrlLabel: isDe ? 'Logo Bild-URL' : 'Logo Image URL',
    showActive: isDe ? 'Aktiv in Listen anzeigen' : 'Show Active',
    deviceTypeLabel: isDe ? 'Gerätetyp' : 'Device Type Name',
    linkedBrandLabel: isDe ? 'Zugeordnete Marke' : 'Linked Brand',
    selectBrand: isDe ? 'Marke auswählen' : 'Select Brand',
    modelNameLabel: isDe ? 'Modellname' : 'Model Name',
    selectType: isDe ? 'Typ auswählen' : 'Select Type',
    generationLabel: isDe ? 'Generation (M1, A16...)' : 'Generation (M1, A16...)',
    releaseYearLabel: isDe ? 'Erscheinungsjahr' : 'Release Year',
    storageLabel: isDe ? 'Speichervarianten' : 'Storage Options',
    colorLabel: isDe ? 'Farben' : 'Color Options',
    repairNameLabel: isDe ? 'Reparaturart Name' : 'Repair Name',
    difficultyLabel: isDe ? 'Schwierigkeit' : 'Difficulty',
    notSet: isDe ? 'Nicht zugewiesen' : 'Not Set',
    selectModel: isDe ? 'Modell auswählen' : 'Select Model',
    selectRepair: isDe ? 'Reparaturart auswählen' : 'Select Repair',
    priceForModelLabel: isDe ? 'Preis für dieses Modell' : 'Price for this Model',
    specificDurationLabel: isDe ? 'Spezifische Dauer (Min)' : 'Specific Duration (Min)',
    durationOverridePlaceholder: isDe ? 'Standard Dauer überschreiben...' : 'Override default duration...',
    cancelBtn: isDe ? 'Abbrechen' : 'Cancel',
    saveBtn: isDe ? 'Speichern' : 'Save',
    activeText: isDe ? 'Aktiv' : 'Active',
    inactiveText: isDe ? 'Inaktiv' : 'Inactive',
    addBtn: isDe ? 'Hinzufügen' : 'Add',
    standard: isDe ? 'Standard' : 'Standard',
  }

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'brands') {
        const list = await api.fetchBrands();
        setBrands(list);
      } else if (activeTab === 'deviceTypes') {
        const [types, allBrands] = await Promise.all([api.fetchDeviceTypes(), api.fetchBrands(true)]);
        setDeviceTypes(types);
        setBrands(allBrands);
      } else if (activeTab === 'models') {
        const [mod, allBrands, allTypes] = await Promise.all([
          api.fetchModels(),
          api.fetchBrands(true),
          api.fetchDeviceTypes(true)
        ]);
        setModels(mod);
        setBrands(allBrands);
        setDeviceTypes(allTypes);
      } else if (activeTab === 'repairTypes') {
        const list = await api.fetchRepairTypes();
        setRepairTypes(list);
      } else if (activeTab === 'priceLists') {
        const [prices, allModels, allRepairs] = await Promise.all([
          api.fetchPriceLists(),
          api.fetchModels(true),
          api.fetchRepairTypes(true)
        ]);
        setPriceLists(prices);
        setModels(allModels);
        setRepairTypes(allRepairs);
      }
    } catch (err) {
      console.error('Failed to load master data:', err);
      showToast('error', isDe ? 'Fehler beim Laden der Stammdaten.' : 'Failed to load master data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    setSearchQuery('');
    setFilterBrandId('');
    setFilterDeviceTypeId('');
    setFilterCategory('');
  }, [activeTab]);

  const openAddModal = () => {
    setEditingId(null);
    setIsModalOpen(true);

    // Reset Forms
    setBrandName('');
    setBrandLogo('');
    setBrandActive(true);

    setDeviceTypeName('');
    setDeviceTypeBrandId('');
    setDeviceTypeActive(true);

    setModelName('');
    setModelBrandId('');
    setModelDeviceTypeId('');
    setModelGen('');
    setModelYear('');
    setModelStorage([]);
    setStorageInput('');
    setModelColors([]);
    setColorsInput('');
    setModelActive(true);

    setRepairTypeName('');
    setRepairTypeCat('Display');
    setRepairTypePrice('');
    setRepairTypeDur('');
    setRepairTypeDiff('');
    setRepairTypeActive(true);

    setPriceListModelId('');
    setPriceListRepairId('');
    setPriceListVal('');
    setPriceListDur('');
    setPriceListActive(true);
  };

  const openEditModal = (item: any) => {
    setEditingId(item.id);
    setIsModalOpen(true);

    if (activeTab === 'brands') {
      const b = item as Brand;
      setBrandName(b.name);
      setBrandLogo(b.logoUrl || '');
      setBrandActive(b.isActive);
    } else if (activeTab === 'deviceTypes') {
      const d = item as DeviceType;
      setDeviceTypeName(d.name);
      setDeviceTypeBrandId(d.brandId);
      setDeviceTypeActive(d.isActive);
    } else if (activeTab === 'models') {
      const m = item as Model;
      setModelName(m.name);
      setModelBrandId(m.brandId);
      setModelDeviceTypeId(m.deviceTypeId);
      setModelGen(m.generation || '');
      setModelYear(m.releaseYear || '');
      setModelStorage(m.storageOptions || []);
      setStorageInput('');
      setModelColors(m.colorOptions || []);
      setColorsInput('');
      setModelActive(m.isActive);
    } else if (activeTab === 'repairTypes') {
      const r = item as RepairType;
      setRepairTypeName(r.name);
      setRepairTypeCat(r.category);
      setRepairTypePrice(r.standardPrice !== null && r.standardPrice !== undefined ? Number(r.standardPrice) : '');
      setRepairTypeDur(r.duration !== null && r.duration !== undefined ? r.duration : '');
      setRepairTypeDiff(r.difficulty || '');
      setRepairTypeActive(r.isActive);
    } else if (activeTab === 'priceLists') {
      const p = item as PriceList;
      setPriceListModelId(p.modelId);
      setPriceListRepairId(p.repairTypeId);
      setPriceListVal(Number(p.price));
      setPriceListDur(p.duration !== null && p.duration !== undefined ? p.duration : '');
      setPriceListActive(p.isActive);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'brands') {
        if (!brandName.trim()) return showToast('error', isDe ? 'Markenname ist erforderlich' : 'Brand Name is required');
        const payload = { name: brandName.trim(), logoUrl: brandLogo.trim() || null, isActive: brandActive };
        if (editingId) {
          await api.updateBrand(editingId, payload);
          showToast('success', isDe ? 'Marke erfolgreich aktualisiert' : 'Brand updated successfully');
        } else {
          await api.createBrand(payload);
          showToast('success', isDe ? 'Marke erfolgreich erstellt' : 'Brand created successfully');
        }
      } else if (activeTab === 'deviceTypes') {
        if (!deviceTypeName.trim() || !deviceTypeBrandId) {
          return showToast('error', isDe ? 'Name und Marke sind erforderlich' : 'Name and Brand selection are required');
        }
        const payload = { name: deviceTypeName.trim(), brandId: deviceTypeBrandId, isActive: deviceTypeActive };
        if (editingId) {
          await api.updateDeviceType(editingId, payload);
          showToast('success', isDe ? 'Gerätetyp erfolgreich aktualisiert' : 'Device type updated successfully');
        } else {
          await api.createDeviceType(payload);
          showToast('success', isDe ? 'Gerätetyp erfolgreich erstellt' : 'Device type created successfully');
        }
      } else if (activeTab === 'models') {
        if (!modelName.trim() || !modelBrandId || !modelDeviceTypeId) {
          return showToast('error', isDe ? 'Name, Marke und Gerätetyp sind erforderlich' : 'Name, Brand, and Device Type selections are required');
        }
        const payload = {
          name: modelName.trim(),
          brandId: modelBrandId,
          deviceTypeId: modelDeviceTypeId,
          generation: modelGen.trim() || null,
          releaseYear: modelYear === '' ? null : Number(modelYear),
          storageOptions: modelStorage,
          colorOptions: modelColors,
          isActive: modelActive
        };
        if (editingId) {
          await api.updateModel(editingId, payload);
          showToast('success', isDe ? 'Modell erfolgreich aktualisiert' : 'Model updated successfully');
        } else {
          await api.createModel(payload);
          showToast('success', isDe ? 'Modell erfolgreich erstellt' : 'Model created successfully');
        }
      } else if (activeTab === 'repairTypes') {
        if (!repairTypeName.trim() || !repairTypeCat) {
          return showToast('error', isDe ? 'Reparaturart-Name und Kategorie sind erforderlich' : 'Repair Type Name and Category are required');
        }
        const payload = {
          name: repairTypeName.trim(),
          category: repairTypeCat,
          standardPrice: repairTypePrice === '' ? null : Number(repairTypePrice),
          duration: repairTypeDur === '' ? null : Number(repairTypeDur),
          difficulty: repairTypeDiff || null,
          isActive: repairTypeActive
        };
        if (editingId) {
          await api.updateRepairType(editingId, payload);
          showToast('success', isDe ? 'Reparaturart erfolgreich aktualisiert' : 'Repair type updated successfully');
        } else {
          await api.createRepairType(payload);
          showToast('success', isDe ? 'Reparaturart erfolgreich erstellt' : 'Repair type created successfully');
        }
      } else if (activeTab === 'priceLists') {
        if (!priceListModelId || !priceListRepairId || priceListVal === '') {
          return showToast('error', isDe ? 'Modell, Reparaturart und Preis sind erforderlich' : 'Model, Repair Type, and Price are required');
        }
        const payload = {
          modelId: priceListModelId,
          repairTypeId: priceListRepairId,
          price: Number(priceListVal),
          duration: priceListDur === '' ? null : Number(priceListDur),
          isActive: priceListActive
        };
        if (editingId) {
          await api.updatePriceList(editingId, payload);
          showToast('success', isDe ? 'Preiszuordnung erfolgreich aktualisiert' : 'Price mapping updated successfully');
        } else {
          await api.createPriceList(payload);
          showToast('success', isDe ? 'Preiszuordnung erfolgreich erstellt' : 'Price mapping created successfully');
        }
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showToast('error', err.message || (isDe ? 'Fehler beim Speichern' : 'Error occurred while saving'));
    }
  };

  const handleDelete = (id: string, name: string) => {
    confirm({
      title: isDe ? 'Element löschen?' : 'Delete Item?',
      message: isDe
        ? `Sind Sie sicher, dass Sie "${name}" dauerhaft löschen möchten? Dies kann nicht rückgängig gemacht werden.`
        : `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
      confirmLabel: isDe ? 'Löschen' : 'Delete',
      cancelLabel: isDe ? 'Abbrechen' : 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          if (activeTab === 'brands') await api.deleteBrand(id);
          else if (activeTab === 'deviceTypes') await api.deleteDeviceType(id);
          else if (activeTab === 'models') await api.deleteModel(id);
          else if (activeTab === 'repairTypes') await api.deleteRepairType(id);
          else if (activeTab === 'priceLists') await api.deletePriceList(id);

          showToast('success', isDe ? 'Erfolgreich gelöscht.' : 'Successfully deleted.');
          loadData();
        } catch (err: any) {
          console.error(err);
          showToast('error', err.message || (isDe ? 'Fehler beim Löschen' : 'Failed to delete item'));
        }
      }
    });
  };

  const handleAddStorageTag = () => {
    if (storageInput.trim() && !modelStorage.includes(storageInput.trim())) {
      setModelStorage([...modelStorage, storageInput.trim()]);
      setStorageInput('');
    }
  };

  const handleAddColorTag = () => {
    if (colorsInput.trim() && !modelColors.includes(colorsInput.trim())) {
      setModelColors([...modelColors, colorsInput.trim()]);
      setColorsInput('');
    }
  };

  const getTabClass = (tab: TabName) => {
    return `pb-4 px-1 text-sm font-semibold border-b-2 transition-all capitalize ${
      activeTab === tab
        ? 'border-primary text-primary font-bold'
        : 'border-transparent text-slate-500 hover:text-slate-900'
    }`;
  };

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{t.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {t.subtitle}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary h-11 px-4 text-sm font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>{t.createNew}</span>
        </button>
      </div>

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6">
          <button onClick={() => setActiveTab('brands')} className={getTabClass('brands')}>{t.tabBrands}</button>
          <button onClick={() => setActiveTab('deviceTypes')} className={getTabClass('deviceTypes')}>{t.tabDeviceTypes}</button>
          <button onClick={() => setActiveTab('models')} className={getTabClass('models')}>{t.tabModels}</button>
          <button onClick={() => setActiveTab('repairTypes')} className={getTabClass('repairTypes')}>{t.tabRepairTypes}</button>
          <button onClick={() => setActiveTab('priceLists')} className={getTabClass('priceLists')}>{t.tabPriceLists}</button>
        </nav>
      </div>

      {/* Filters Area */}
      <div className="card p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input h-10 pl-10"
          />
        </div>

        {/* Brand Dropdown Filter */}
        {(activeTab === 'deviceTypes' || activeTab === 'models') && (
          <select
            value={filterBrandId}
            onChange={(e) => setFilterBrandId(e.target.value)}
            className="input h-10 w-full md:w-48 bg-white"
          >
            <option value="">{t.allBrands}</option>
            {brands.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}

        {/* Device Type Dropdown Filter */}
        {activeTab === 'models' && (
          <select
            value={filterDeviceTypeId}
            onChange={(e) => setFilterDeviceTypeId(e.target.value)}
            className="input h-10 w-full md:w-48 bg-white"
          >
            <option value="">{t.allTypes}</option>
            {deviceTypes
              .filter(t => !filterBrandId || t.brandId === filterBrandId)
              .map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
          </select>
        )}

        {/* Category Dropdown Filter */}
        {(activeTab === 'repairTypes' || activeTab === 'priceLists') && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input h-10 w-full md:w-48 bg-white"
          >
            <option value="">{t.allCategories}</option>
            <option value="Display">Display</option>
            <option value="Battery">Battery</option>
            <option value="WaterDamage">WaterDamage</option>
            <option value="Software">Software</option>
            <option value="LogicBoard">LogicBoard</option>
            <option value="Camera">Camera</option>
            <option value="ChargingPort">ChargingPort</option>
            <option value="Keyboard">Keyboard</option>
            <option value="Other">Other</option>
          </select>
        )}
      </div>

      {/* Main Table view */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'brands' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">{t.thBrandName}</th>
                    <th className="px-6 py-4">{t.thStatus}</th>
                    <th className="px-6 py-4 text-right">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {brands
                    .filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(b => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-3">
                          {b.logoUrl ? (
                            <img src={b.logoUrl} alt={b.name} className="h-7 w-7 object-contain rounded border bg-white" />
                          ) : (
                            <div className="h-7 w-7 bg-slate-100 text-slate-500 rounded border flex items-center justify-center font-bold text-xs uppercase">
                              {b.name.charAt(0)}
                            </div>
                          )}
                          <span>{b.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${b.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {b.isActive ? t.activeText : t.inactiveText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(b)} className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50" title={isDe ? 'Bearbeiten' : 'Edit'}><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(b.id, b.name)} className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50" title={isDe ? 'Löschen' : 'Delete'}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'deviceTypes' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">{t.thType}</th>
                    <th className="px-6 py-4">{t.thBrand}</th>
                    <th className="px-6 py-4">{t.thStatus}</th>
                    <th className="px-6 py-4 text-right">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deviceTypes
                    .filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(t => !filterBrandId || t.brandId === filterBrandId)
                    .map(tData => (
                      <tr key={tData.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-slate-400" />
                          {tData.name}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{tData.brand?.name}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tData.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {tData.isActive ? t.activeText : t.inactiveText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(tData)} className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50" title={isDe ? 'Bearbeiten' : 'Edit'}><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(tData.id, tData.name)} className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50" title={isDe ? 'Löschen' : 'Delete'}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'models' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">{t.thModel}</th>
                    <th className="px-6 py-4">{t.thBrand}</th>
                    <th className="px-6 py-4">{t.thType}</th>
                    <th className="px-6 py-4">{t.thGeneration}</th>
                    <th className="px-6 py-4">{t.thTechSpecs}</th>
                    <th className="px-6 py-4">{t.thStatus}</th>
                    <th className="px-6 py-4 text-right">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {models
                    .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .filter(m => !filterBrandId || m.brandId === filterBrandId)
                    .filter(m => !filterDeviceTypeId || m.deviceTypeId === filterDeviceTypeId)
                    .map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-bold text-slate-800">{m.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{m.brand?.name}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{m.deviceType?.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{m.generation || '-'}</td>
                        <td className="px-6 py-4 text-xs space-y-1">
                          {m.storageOptions?.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-400 mr-1 uppercase">{isDe ? 'Speicher:' : 'Disk:'}</span>
                              <span className="text-slate-600">{m.storageOptions.join(', ')}</span>
                            </div>
                          )}
                          {m.colorOptions?.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-400 mr-1 uppercase">{isDe ? 'Farbe:' : 'Color:'}</span>
                              <span className="text-slate-600">{m.colorOptions.join(', ')}</span>
                            </div>
                          )}
                          {m.releaseYear && (
                            <div>
                              <span className="font-semibold text-slate-400 mr-1 uppercase">{isDe ? 'Jahr:' : 'Year:'}</span>
                              <span className="text-slate-600">{m.releaseYear}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${m.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                            {m.isActive ? t.activeText : t.inactiveText}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(m)} className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50" title={isDe ? 'Bearbeiten' : 'Edit'}><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(m.id, m.name)} className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50" title={isDe ? 'Löschen' : 'Delete'}><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}

            {activeTab === 'repairTypes' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">{t.thRepairType}</th>
                    <th className="px-6 py-4">{t.thCategory}</th>
                    <th className="px-6 py-4">{t.thStdPrice}</th>
                    <th className="px-6 py-4">{t.thDuration}</th>
                    <th className="px-6 py-4">{t.thDifficulty}</th>
                    <th className="px-6 py-4">{t.thStatus}</th>
                    <th className="px-6 py-4 text-right">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES.map(cat => {
                    const items = repairTypes
                      .filter(r => r.category === cat)
                      .filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .filter(r => !filterCategory || r.category === filterCategory);

                    if (items.length === 0) return null;

                    return (
                      <Fragment key={`repair-cat-${cat}`}>
                        <tr className="bg-slate-100/50">
                          <td colSpan={7} className="px-6 py-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-y border-slate-200 bg-slate-50/50">
                            {cat} ({items.length})
                          </td>
                        </tr>
                        {items.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                              <Wrench className="h-4 w-4 text-slate-400" />
                              {r.name}
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-semibold">{r.category}</td>
                            <td className="px-6 py-4 text-slate-700 font-bold">
                              {r.standardPrice !== null && r.standardPrice !== undefined ? `${Number(r.standardPrice).toFixed(2)} €` : '-'}
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">
                              {r.duration ? `${r.duration} Min` : '-'}
                            </td>
                            <td className="px-6 py-4">
                              {r.difficulty ? (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                  r.difficulty === 'Easy' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  r.difficulty === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                  r.difficulty === 'Difficult' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                  'bg-red-50 text-red-700 border-red-100'
                                }`}>
                                  {r.difficulty}
                                </span>
                              ) : '-'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${r.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {r.isActive ? t.activeText : t.inactiveText}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEditModal(r)} className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50" title={isDe ? 'Bearbeiten' : 'Edit'}><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDelete(r.id, r.name)} className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50" title={isDe ? 'Löschen' : 'Delete'}><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === 'priceLists' && (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">{t.thDeviceModel}</th>
                    <th className="px-6 py-4">{t.thRepairType}</th>
                    <th className="px-6 py-4">{t.thPrice}</th>
                    <th className="px-6 py-4">{t.thSpecificDuration}</th>
                    <th className="px-6 py-4">{t.thStatus}</th>
                    <th className="px-6 py-4 text-right">{t.thActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CATEGORIES.map(cat => {
                    const items = priceLists
                      .filter(p => p.repairType?.category === cat)
                      .filter(p => {
                        const search = searchQuery.toLowerCase();
                        return (
                          (p.model?.name || '').toLowerCase().includes(search) ||
                          (p.repairType?.name || '').toLowerCase().includes(search) ||
                          (p.model?.brand?.name || '').toLowerCase().includes(search)
                        );
                      })
                      .filter(p => !filterCategory || p.repairType?.category === filterCategory);

                    if (items.length === 0) return null;

                    return (
                      <Fragment key={`price-cat-${cat}`}>
                        <tr className="bg-slate-100/50">
                          <td colSpan={6} className="px-6 py-2 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-y border-slate-200 bg-slate-50/50">
                            {cat} ({items.length})
                          </td>
                        </tr>
                        {items.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{p.model?.name}</div>
                              <div className="text-xs text-slate-500">{p.model?.brand?.name} · {p.model?.deviceType?.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-700">{p.repairType?.name}</div>
                              <div className="text-[10px] bg-slate-100 text-slate-500 rounded px-1.5 py-0.5 inline-block uppercase font-bold mt-1">
                                {p.repairType?.category}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-extrabold text-slate-900 text-base">{Number(p.price).toFixed(2)} €</td>
                            <td className="px-6 py-4 text-slate-600 font-medium">
                              {p.duration ? `${p.duration} Min` : <span className="text-slate-400 italic">{t.standard}</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${p.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {p.isActive ? t.activeText : t.inactiveText}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openEditModal(p)} className="btn btn-outline border-slate-200 text-slate-600 p-1.5 h-8 w-8 hover:bg-slate-50" title={isDe ? 'Bearbeiten' : 'Edit'}><Edit2 className="h-3.5 w-3.5" /></button>
                                <button onClick={() => handleDelete(p.id, `${p.model?.name} - ${p.repairType?.name}`)} className="btn btn-outline border-red-100 text-red-600 p-1.5 h-8 w-8 hover:bg-red-50" title={isDe ? 'Löschen' : 'Delete'}><Trash2 className="h-3.5 w-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CRUD Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="card w-full max-w-lg shadow-2xl relative bg-white border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-150 px-5 py-4 bg-slate-50 rounded-t-xl">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingId ? t.editEntry : t.createEntry}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {activeTab === 'brands' && (
                <>
                  <div>
                    <label className="label">{t.brandNameLabel} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input mt-1.5 h-11 text-sm font-medium"
                      placeholder="e.g. Apple, Samsung"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">{t.logoUrlLabel}</label>
                    <input
                      type="url"
                      className="input mt-1.5 h-11 text-sm"
                      placeholder="https://example.com/logo.png"
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="brandActive"
                      checked={brandActive}
                      onChange={(e) => setBrandActive(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    />
                    <label htmlFor="brandActive" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      {t.showActive}
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'deviceTypes' && (
                <>
                  <div>
                    <label className="label">{t.deviceTypeLabel} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input mt-1.5 h-11 text-sm font-medium"
                      placeholder="e.g. iPhone, MacBook, iPad"
                      value={deviceTypeName}
                      onChange={(e) => setDeviceTypeName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">{t.linkedBrandLabel} <span className="text-red-500">*</span></label>
                    <select
                      value={deviceTypeBrandId}
                      onChange={(e) => setDeviceTypeBrandId(e.target.value)}
                      className="input mt-1.5 h-11 text-sm bg-white"
                      required
                    >
                      <option value="">{t.selectBrand}</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="deviceTypeActive"
                      checked={deviceTypeActive}
                      onChange={(e) => setDeviceTypeActive(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    />
                    <label htmlFor="deviceTypeActive" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      {t.showActive}
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'models' && (
                <>
                  <div>
                    <label className="label">{t.modelNameLabel} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input mt-1.5 h-11 text-sm font-medium"
                      placeholder="e.g. iPhone 14 Pro, Galaxy S23"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t.thBrand} <span className="text-red-500">*</span></label>
                      <select
                        value={modelBrandId}
                        onChange={(e) => setModelBrandId(e.target.value)}
                        className="input mt-1.5 h-11 text-sm bg-white"
                        required
                      >
                        <option value="">{t.thBrand}</option>
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">{t.thType} <span className="text-red-500">*</span></label>
                      <select
                        value={modelDeviceTypeId}
                        onChange={(e) => setModelDeviceTypeId(e.target.value)}
                        className="input mt-1.5 h-11 text-sm bg-white"
                        required
                      >
                        <option value="">{t.selectType}</option>
                        {deviceTypes
                          .filter(tData => !modelBrandId || tData.brandId === modelBrandId)
                          .map(tData => (
                            <option key={tData.id} value={tData.id}>{tData.name}</option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t.generationLabel}</label>
                      <input
                        type="text"
                        className="input mt-1.5 h-11 text-sm"
                        placeholder="e.g. A16 Bionic"
                        value={modelGen}
                        onChange={(e) => setModelGen(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label">{t.releaseYearLabel}</label>
                      <input
                        type="number"
                        className="input mt-1.5 h-11 text-sm"
                        placeholder="e.g. 2023"
                        value={modelYear}
                        onChange={(e) => setModelYear(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Storage Options Tag List */}
                  <div>
                    <label className="label">{t.storageLabel}</label>
                    <div className="flex gap-2 mt-1.5">
                      <input
                        type="text"
                        className="input h-10 text-sm"
                        placeholder="e.g. 128GB, 256GB"
                        value={storageInput}
                        onChange={(e) => setStorageInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStorageTag())}
                      />
                      <button
                        type="button"
                        onClick={handleAddStorageTag}
                        className="btn btn-outline border-slate-200 h-10 px-3 hover:bg-slate-50"
                      >
                        {t.addBtn}
                      </button>
                    </div>
                    {modelStorage.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {modelStorage.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                            {tag}
                            <button type="button" onClick={() => setModelStorage(modelStorage.filter(tData => tData !== tag))} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colors Option Tag List */}
                  <div>
                    <label className="label">{t.colorLabel}</label>
                    <div className="flex gap-2 mt-1.5">
                      <input
                        type="text"
                        className="input h-10 text-sm"
                        placeholder="e.g. Space Gray, Silver"
                        value={colorsInput}
                        onChange={(e) => setColorsInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColorTag())}
                      />
                      <button
                        type="button"
                        onClick={handleAddColorTag}
                        className="btn btn-outline border-slate-200 h-10 px-3 hover:bg-slate-50"
                      >
                        {t.addBtn}
                      </button>
                    </div>
                    {modelColors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {modelColors.map(tag => (
                          <span key={tag} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                            {tag}
                            <button type="button" onClick={() => setModelColors(modelColors.filter(tData => tData !== tag))} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="modelActive"
                      checked={modelActive}
                      onChange={(e) => setModelActive(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    />
                    <label htmlFor="modelActive" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      {t.showActive}
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'repairTypes' && (
                <>
                  <div>
                    <label className="label">{t.repairNameLabel} <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      className="input mt-1.5 h-11 text-sm font-medium"
                      placeholder="e.g. Displaytausch (Original), Akkuwechsel"
                      value={repairTypeName}
                      onChange={(e) => setRepairTypeName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">{t.thCategory} <span className="text-red-500">*</span></label>
                    <select
                      value={repairTypeCat}
                      onChange={(e) => setRepairTypeCat(e.target.value as any)}
                      className="input mt-1.5 h-11 text-sm bg-white"
                      required
                    >
                      <option value="Display">Display</option>
                      <option value="Battery">{isDe ? 'Akku (Battery)' : 'Battery'}</option>
                      <option value="WaterDamage">{isDe ? 'Wasserschaden (Water Damage)' : 'Water Damage'}</option>
                      <option value="Software">Software</option>
                      <option value="LogicBoard">LogicBoard</option>
                      <option value="Camera">{isDe ? 'Kamera (Camera)' : 'Camera'}</option>
                      <option value="ChargingPort">{isDe ? 'Ladeanschluss (Charging Port)' : 'Charging Port'}</option>
                      <option value="Keyboard">{isDe ? 'Tastatur (Keyboard)' : 'Keyboard'}</option>
                      <option value="Other">{isDe ? 'Sonstiges (Other)' : 'Other'}</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="label">{t.thStdPrice} (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1.5 h-11 text-sm"
                        placeholder="e.g. 99.00"
                        value={repairTypePrice}
                        onChange={(e) => setRepairTypePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="label">{t.thDuration} (Min)</label>
                      <input
                        type="number"
                        className="input mt-1.5 h-11 text-sm"
                        placeholder="e.g. 45"
                        value={repairTypeDur}
                        onChange={(e) => setRepairTypeDur(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">{t.difficultyLabel}</label>
                    <select
                      value={repairTypeDiff}
                      onChange={(e) => setRepairTypeDiff(e.target.value as any)}
                      className="input mt-1.5 h-11 text-sm bg-white"
                    >
                      <option value="">{t.notSet}</option>
                      <option value="Easy">{isDe ? 'Einfach (Easy)' : 'Easy'}</option>
                      <option value="Medium">{isDe ? 'Mittel (Medium)' : 'Medium'}</option>
                      <option value="Difficult">{isDe ? 'Schwer (Difficult)' : 'Difficult'}</option>
                      <option value="Expert">{isDe ? 'Profi (Expert)' : 'Expert'}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="repairTypeActive"
                      checked={repairTypeActive}
                      onChange={(e) => setRepairTypeActive(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    />
                    <label htmlFor="repairTypeActive" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      {t.showActive}
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'priceLists' && (
                <>
                  <div>
                    <label className="label">{t.thDeviceModel} <span className="text-red-500">*</span></label>
                    <select
                      value={priceListModelId}
                      onChange={(e) => setPriceListModelId(e.target.value)}
                      className="input mt-1.5 h-11 text-sm bg-white"
                      required
                    >
                      <option value="">{t.selectModel}</option>
                      {models.map(m => (
                        <option key={m.id} value={m.id}>{m.brand?.name} {m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">{t.thRepairType} <span className="text-red-500">*</span></label>
                    <select
                      value={priceListRepairId}
                      onChange={(e) => setPriceListRepairId(e.target.value)}
                      className="input mt-1.5 h-11 text-sm bg-white"
                      required
                    >
                      <option value="">{t.selectRepair}</option>
                      {repairTypes.map(r => (
                        <option key={r.id} value={r.id}>{r.name} ({r.category})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="label">{t.priceForModelLabel} <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        className="input mt-1.5 h-11 text-sm font-bold text-slate-900"
                        placeholder="e.g. 119.00"
                        value={priceListVal}
                        onChange={(e) => setPriceListVal(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">{t.specificDurationLabel}</label>
                      <input
                        type="number"
                        className="input mt-1.5 h-11 text-sm"
                        placeholder={t.durationOverridePlaceholder}
                        value={priceListDur}
                        onChange={(e) => setPriceListDur(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="checkbox"
                      id="priceListActive"
                      checked={priceListActive}
                      onChange={(e) => setPriceListActive(e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                    />
                    <label htmlFor="priceListActive" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      {t.showActive}
                    </label>
                  </div>
                </>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline border-slate-200 h-11 px-5"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary h-11 px-6 font-semibold"
                >
                  {t.saveBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
