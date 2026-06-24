import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  getPublicWidgetSettings,
  getPublicBrands,
  getPublicDeviceTypes,
  getPublicModels,
  getPublicRepairTypes,
  getPublicRepairPrice,
  submitPublicRepairRequest,
} from '../../api/repairRequests.js'
import type {
  WidgetSettings,
  PublicBrand,
  PublicDeviceType,
  PublicModel
} from '../../api/repairRequests.js'
import {
  Calendar,
  Upload,
  User,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Info
} from 'lucide-react'

export default function PublicWidgetPage() {
  const { shopId } = useParams<{ shopId: string }>()

  // Styles & configuration settings
  const [settings, setSettings] = useState<WidgetSettings | null>(null)
  const [loadingSettings, setLoadingSettings] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Wizard state
  const [step, setStep] = useState(1)

  // Master lists
  const [brands, setBrands] = useState<PublicBrand[]>([])
  const [deviceTypes, setDeviceTypes] = useState<PublicDeviceType[]>([])
  const [models, setModels] = useState<PublicModel[]>([])
  const [repairTypes, setRepairTypes] = useState<any[]>([])

  // User selections
  const [selectedBrand, setSelectedBrand] = useState<PublicBrand | null>(null)
  const [selectedDeviceType, setSelectedDeviceType] = useState<PublicDeviceType | null>(null)
  const [selectedModel, setSelectedModel] = useState<PublicModel | null>(null)
  const [selectedRepairType, setSelectedRepairType] = useState<any | null>(null)

  // Estimated Price State
  const [priceLoading, setPriceLoading] = useState(false)
  const [estimatedPrice, setEstimatedPrice] = useState<{ price: number; duration: number } | null>(null)

  // Form inputs
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Submit states
  const [submitting, setSubmitting] = useState(false)
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null)

  // Load settings and initial list of brands & repair types
  useEffect(() => {
    if (!shopId) {
      setError('No shop identifier provided.')
      setLoadingSettings(false)
      return
    }

    const init = async () => {
      try {
        setLoadingSettings(true)
        const widgetSettings = await getPublicWidgetSettings(shopId)
        setSettings(widgetSettings)

        // Load brands and repair types
        const [brandList, repairList] = await Promise.all([
          getPublicBrands(),
          getPublicRepairTypes()
        ])
        setBrands(brandList)
        setRepairTypes(repairList)
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Unable to load widget configuration.')
      } finally {
        setLoadingSettings(false)
      }
    }

    init()
  }, [shopId])

  // Load device types when brand is selected
  useEffect(() => {
    if (!selectedBrand) {
      setDeviceTypes([])
      setSelectedDeviceType(null)
      return
    }
    const loadTypes = async () => {
      try {
        const types = await getPublicDeviceTypes(selectedBrand.id)
        setDeviceTypes(types)
        setSelectedDeviceType(null)
        setSelectedModel(null)
      } catch (err) {
        console.error(err)
      }
    }
    loadTypes()
  }, [selectedBrand])

  // Load models when device type is selected
  useEffect(() => {
    if (!selectedDeviceType) {
      setModels([])
      setSelectedModel(null)
      return
    }
    const loadModels = async () => {
      try {
        const list = await getPublicModels(selectedDeviceType.id)
        setModels(list)
        setSelectedModel(null)
      } catch (err) {
        console.error(err)
      }
    }
    loadModels()
  }, [selectedDeviceType])

  // Fetch estimated price when model and repair type are selected
  useEffect(() => {
    if (!selectedModel || !selectedRepairType) {
      setEstimatedPrice(null)
      return
    }
    const loadPrice = async () => {
      try {
        setPriceLoading(true)
        const priceInfo = await getPublicRepairPrice(selectedModel.id, selectedRepairType.id)
        setEstimatedPrice(priceInfo)
      } catch (err) {
        console.error(err)
      } finally {
        setPriceLoading(false)
      }
    }
    loadPrice()
  }, [selectedModel, selectedRepairType])

  // Cleanup file preview url
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setPhotoFile(file)
      setPhotoPreview(URL.createObjectURL(file))
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shopId) return

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      alert('Please fill out all contact details.')
      return
    }

    try {
      setSubmitting(true)

      const formData = new FormData()
      formData.append('shopId', shopId)
      formData.append('customerName', customerName.trim())
      formData.append('customerEmail', customerEmail.trim())
      formData.append('customerPhone', customerPhone.trim())
      formData.append('deviceBrand', selectedBrand?.name || '')
      formData.append('deviceType', selectedDeviceType?.name || '')
      formData.append('deviceModel', selectedModel?.name || '')
      formData.append('repairType', selectedRepairType?.name || '')
      formData.append('issueDescription', issueDescription.trim())

      if (appointmentDate && appointmentTime) {
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`)
        formData.append('preferredAppointment', appointmentDateTime.toISOString())
      }

      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const request = await submitPublicRepairRequest(formData)
      setSubmittedRequest(request)
      setStep(6) // Success Screen
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Failed to submit repair request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Dynamic CSS variables mapping for branding
  const primaryColor = settings?.widgetPrimaryColor || '#0284c7'
  const accentColor = settings?.widgetAccentColor || '#0f172a'
  const fontStyle = settings?.widgetFont || 'Inter'

  const customStyle = {
    '--primary': primaryColor,
    '--primary-hover': `${primaryColor}e6`, // slightly lighter/darker
    '--accent': accentColor,
    fontFamily: fontStyle
  } as React.CSSProperties

  if (loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading repair booking widget...</p>
        </div>
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Widget Offline</h2>
          <p className="text-slate-500 mb-6">{error || 'This repair widget is temporarily unavailable.'}</p>
          <div className="text-xs text-slate-400">Please contact the repair shop directly.</div>
        </div>
      </div>
    )
  }

  const nextDisabled = () => {
    if (step === 1) return !selectedBrand || !selectedDeviceType || !selectedModel
    if (step === 2) return !selectedRepairType
    if (step === 3) return !appointmentDate || !appointmentTime
    if (step === 4) return !issueDescription.trim()
    return false
  }

  const stepTitles = [
    'Device Selection',
    'Choose Repair',
    'Schedule Slot',
    'Problem Details',
    'Contact Info'
  ]

  return (
    <div style={customStyle} className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 text-slate-700">
      <div className="mx-auto flex max-h-[calc(100dvh-5rem)] max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
        <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-6 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            {settings.widgetShowLogo && settings.logoDataUrl ? (
              <img
                src={settings.logoDataUrl}
                alt={`${settings.shopName} Logo`}
                className="h-10 w-auto object-contain max-w-[150px]"
              />
            ) : (
              <Smartphone className="w-8 h-8 text-[var(--primary)]" />
            )}
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">{settings.shopName || 'Local Repair Shop'}</h1>
              <p className="text-xs text-slate-400">Online Repair Request Widget</p>
            </div>
          </div>
          <div className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-100 text-slate-500">
            Secure Booking
          </div>
        </div>

        {/* Wizard Progress Steps */}
        {step <= 5 && (
          <div className="px-6 pt-6 pb-2 border-b border-slate-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                Step {step} of 5
              </span>
              <span className="text-sm font-semibold text-slate-800">
                {stepTitles[step - 1]}
              </span>
            </div>
            
            {/* Visual Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className="h-full flex-1 transition-all duration-300"
                  style={{
                    backgroundColor: s <= step ? 'var(--primary)' : '#e2e8f0'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Dynamic Wizard Steps */}
        <div className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Select Your Device</h2>
                <p className="text-sm text-slate-500">Tell us what device requires servicing to see correct options.</p>
              </div>

              {/* Brands selection */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">1. Brand</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {brands.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(b)
                        setSelectedDeviceType(null)
                        setSelectedModel(null)
                      }}
                      className={`p-4 rounded-xl border text-center font-semibold transition-all hover:scale-[1.02] hover:border-slate-300 ${
                        selectedBrand?.id === b.id
                          ? 'border-[var(--primary)] bg-sky-50/20 text-[var(--primary)] ring-2 ring-[var(--primary)]/10'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {b.logoUrl ? (
                        <img src={b.logoUrl} alt={b.name} className="h-6 mx-auto object-contain mb-1" />
                      ) : null}
                      <span className="text-sm">{b.name}</span>
                    </button>
                  ))}
                  {brands.length === 0 && (
                    <div className="col-span-full py-4 text-center text-slate-400 text-sm">
                      No brands available. Please check settings.
                    </div>
                  )}
                </div>
              </div>

              {/* Device Types selection */}
              {selectedBrand && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-slate-600 mb-2">2. Device Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {deviceTypes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setSelectedDeviceType(t)
                          setSelectedModel(null)
                        }}
                        className={`p-3 rounded-xl border text-center font-medium transition-all hover:scale-[1.02] hover:border-slate-300 ${
                          selectedDeviceType?.id === t.id
                            ? 'border-[var(--primary)] bg-sky-50/20 text-[var(--primary)] ring-2 ring-[var(--primary)]/10'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="text-sm">{t.name}</span>
                      </button>
                    ))}
                    {deviceTypes.length === 0 && (
                      <div className="col-span-full py-2 text-slate-400 text-sm">
                        No device types found for {selectedBrand.name}.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Models selection */}
              {selectedDeviceType && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-bold text-slate-600 mb-2">3. Model</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedModel(m)}
                        className={`p-3 rounded-xl border text-left font-medium transition-all hover:scale-[1.02] hover:border-slate-300 ${
                          selectedModel?.id === m.id
                            ? 'border-[var(--primary)] bg-sky-50/20 text-[var(--primary)] ring-2 ring-[var(--primary)]/10'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <span className="text-sm block font-semibold">{m.name}</span>
                      </button>
                    ))}
                    {models.length === 0 && (
                      <div className="col-span-full py-2 text-slate-400 text-sm">
                        No models found for this category.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Select Required Repair</h2>
                <p className="text-sm text-slate-500">
                  Select the repair needed. We will instantly estimate your purchase/repair service pricing.
                </p>
              </div>

              {/* Selected Model Details breadcrumb banner */}
              <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Selected Device</span>
                  <div className="font-bold text-slate-800">
                    {selectedBrand?.name} {selectedModel?.name}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRepairType(null)
                    setStep(1)
                  }}
                  className="text-xs text-[var(--primary)] font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* Repair categories list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {repairTypes.map((rt) => (
                  <button
                    key={rt.id}
                    type="button"
                    onClick={() => setSelectedRepairType(rt)}
                    className={`p-4 rounded-xl border text-left flex items-start justify-between transition-all hover:scale-[1.01] hover:border-slate-300 ${
                      selectedRepairType?.id === rt.id
                        ? 'border-[var(--primary)] bg-sky-50/25 ring-2 ring-[var(--primary)]/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div>
                      <h3 className="font-bold text-slate-800">{rt.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Category: {rt.category}</p>
                      {rt.duration && (
                        <p className="text-xs text-slate-500 mt-1">Est. Duration: {rt.duration} mins</p>
                      )}
                    </div>
                    {selectedRepairType?.id === rt.id && (
                      <span className="h-5 w-5 bg-[var(--primary)] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Price Reveal Box */}
              {selectedRepairType && (
                <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-slate-800">Estimated Price Summary</h4>
                      <p className="text-xs text-slate-400">Subject to visual diagnostic checks at dropoff.</p>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    {priceLoading ? (
                      <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-3xl font-extrabold text-slate-900">
                          {estimatedPrice ? `$${estimatedPrice.price.toFixed(2)}` : '$0.00'}
                        </span>
                        {estimatedPrice && estimatedPrice.duration > 0 && (
                          <div className="text-xs text-slate-500 mt-0.5">
                            Ready in approx. {estimatedPrice.duration} mins
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Choose Preferred Appointment</h2>
                <p className="text-sm text-slate-500">Pick a date and time for device dropoff or repair pickup.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Preferred Date</label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all font-semibold"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Preferred Time Slot</label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all font-semibold"
                  >
                    <option value="">Select slot...</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="14:00">02:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="16:00">04:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-400 flex gap-2.5 items-start mt-4">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  Appointments are tentative and subject to confirmation by email/phone. The shop keeper will contact you to align final scheduling availability.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Issue Description & Uploads</h2>
                <p className="text-sm text-slate-500">Provide details on the fault and upload pictures of any damage.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Description of Issue</label>
                <textarea
                  rows={4}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Example: The screen has a deep cracks on the lower left corner and flickers black. Touch still functions but backlight drops occasionally..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all placeholder:text-slate-300 text-sm"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Upload Photo of Damage (Optional)</label>
                
                {photoPreview ? (
                  <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-md border border-slate-100">
                    <img src={photoPreview} alt="Damage Upload Preview" className="w-full h-48 object-cover" />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full p-1.5 shadow-sm transition-colors text-xs font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-full border-2 border-dashed border-slate-200 hover:border-[var(--primary)] transition-colors rounded-xl p-8 text-center bg-slate-50/50">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <span className="text-sm font-bold text-slate-600">Choose file or drag here</span>
                      <span className="text-xs text-slate-400">JPG, PNG, or WEBP. Max size 5MB.</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-1">Your Contact Details</h2>
                <p className="text-sm text-slate-500">Provide details so the shop representative can reach you.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="jane.doe@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">Phone Number</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all text-sm font-semibold"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {step === 6 && submittedRequest && (
            <div className="text-center py-10 px-4 space-y-6 animate-fadeIn">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto animate-bounce" />
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Booking Submitted Successfully!</h2>
                <p className="text-slate-500 text-sm mt-1.5 max-w-md mx-auto">
                  Thank you for booking with {settings.shopName || 'our shop'}. Your ticket has been logged and a representative will contact you shortly.
                </p>
              </div>

              {/* Ticket Details summary card */}
              <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 text-left border border-slate-100 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200/60">
                  <span className="text-xs uppercase font-bold text-slate-400">Ticket Status</span>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                    New Ticket
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Device</span>
                    <strong className="text-slate-800 font-bold">
                      {submittedRequest.deviceBrand} {submittedRequest.deviceModel}
                    </strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Requested Repair</span>
                    <strong className="text-slate-800 font-bold">{submittedRequest.repairType}</strong>
                  </div>

                  {submittedRequest.preferredAppointment && (
                    <div className="col-span-2">
                      <span className="text-xs text-slate-400 block">Preferred Appointment Slot</span>
                      <strong className="text-slate-800 font-bold flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(submittedRequest.preferredAppointment).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand(null)
                    setSelectedDeviceType(null)
                    setSelectedModel(null)
                    setSelectedRepairType(null)
                    setAppointmentDate('')
                    setAppointmentTime('')
                    setIssueDescription('')
                    removePhoto()
                    setCustomerName('')
                    setCustomerEmail('')
                    setCustomerPhone('')
                    setSubmittedRequest(null)
                    setStep(1)
                  }}
                  className="px-6 py-2.5 rounded-full font-bold text-sm bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md transition-colors"
                >
                  Book Another Device
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Wizard Footer Controls */}
        {step <= 5 && (
          <div className="modal-action-footer shrink-0 flex flex-col gap-3 border-t border-slate-100 bg-slate-50/95 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition-all hover:border-slate-300 hover:bg-slate-100 sm:w-auto"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            {step < 5 ? (
              <button
                type="button"
                disabled={nextDisabled()}
                onClick={() => setStep(step + 1)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all sm:ml-auto sm:w-auto"
                style={{
                  backgroundColor: nextDisabled() ? '#cbd5e1' : 'var(--primary)',
                  cursor: nextDisabled() ? 'not-allowed' : 'pointer',
                }}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all sm:ml-auto sm:w-auto"
                style={{
                  backgroundColor: 'var(--primary)',
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'wait' : 'pointer',
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
