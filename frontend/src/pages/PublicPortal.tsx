import React, { useState, useEffect } from 'react';
import {
  Scissors,
  MapPin,
  Clock,
  Globe,
  Sparkles,
  Sparkle,
  Gem,
  Heart,
  ChevronDown,
  Search,
  Copy,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { LoadingSpinner } from '../components/common';
import { apiClient } from '../utils/apiClient';
import { useBranch } from '../context/BranchContext';

import gelExtensionsImg from '../assets/gel_extensions.webp';
import gelPolishImg from '../assets/gel_polish.webp';
import gelNaturalImg from '../assets/gel_natural.webp';
import type { Branch, Service, Employee, Appointment } from '../types';

/** Time slots shown to customers in the booking and walk-in forms.
 *  Update this list when the salon changes its operating hours. */
const TIME_SLOTS = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
] as const;

export type PublicPortalEmployee = Employee;

interface PublicPortalProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  branches: Branch[];
  navigateTo: (path: string) => void;
  onPublicWalkinSubmit: (entry: {
    firstName: string;
    lastName: string;
    phone: string;
    serviceId: string;
    branchId?: string;
  }) => void;
  onPublicBookingSubmit: (entry: {
    firstName: string;
    lastName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
    date: string;
    startTime: string;
    branchId?: string;
  }) => void;
  isAddingWalkin: boolean;
  isBookingAppointment: boolean;
}

export function PublicPortal({
  activeTab,
  setActiveTab,
  branches,
  navigateTo,
  onPublicWalkinSubmit,
  onPublicBookingSubmit,
  isAddingWalkin,
  isBookingAppointment,
}: PublicPortalProps) {
  const { showToast } = useNotification();
  const { lastBookedAppointment, clearLastBookedAppointment } = useBranch();

  const [selectedBranchId, setSelectedBranchId] = useState('');

  // Lookup & Self-Cancellation states
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupBookingRef, setLookupBookingRef] = useState('');
  const [lookupResult, setLookupResult] = useState<Appointment | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupPhone || !lookupBookingRef) {
      showToast('Please fill out all lookup fields.', 'error');
      return;
    }

    setIsSearching(true);
    setLookupError('');
    try {
      const data = await apiClient.post<Appointment>(
        '/api/appointments/lookup',
        {
          phone: lookupPhone,
          bookingRef: lookupBookingRef,
        },
        { skipAuth: true }
      );
      setLookupResult(data);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      setLookupError(error.message || 'Appointment not found or phone mismatch.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!lookupResult) return;
    setIsCanceling(true);
    try {
      const data = await apiClient.post<Appointment>(
        `/api/appointments/${lookupResult.id}/cancel-public`,
        {
          phone: lookupPhone,
        },
        { skipAuth: true }
      );
      showToast('Appointment successfully canceled.', 'success');
      setLookupResult(data);
      setShowCancelConfirm(false);
    } catch (err) {
      const error = err as Error;
      console.error(error);
      showToast(error.message || 'Failed to cancel appointment.', 'error');
    } finally {
      setIsCanceling(false);
    }
  };

  const currentBranchId = selectedBranchId || branches[0]?.id || '';

  const activeServices = React.useMemo(() => {
    const branch = branches.find((b) => b.id === currentBranchId) || branches[0];
    return (branch?.services || []).filter((s) => s.isActive);
  }, [branches, currentBranchId]);

  const activeEmployees = React.useMemo(() => {
    const branch = branches.find((b) => b.id === currentBranchId) || branches[0];
    return (branch?.employees || []).filter((e) => e.isActive && e.role !== 'OWNER');
  }, [branches, currentBranchId]);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    if (d.getHours() >= 17) {
      d.setDate(d.getDate() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const timeSlots = React.useMemo(() => TIME_SLOTS, []);

  // Walk-in form state
  const [publicWalkinName, setPublicWalkinName] = useState('');
  const [publicWalkinLastName, setPublicWalkinLastName] = useState('');
  const [publicWalkinPhone, setPublicWalkinPhone] = useState('');
  const [publicWalkinServiceId, setPublicWalkinServiceId] = useState('');

  // Booking form state
  const [bookingFirstName, setBookingFirstName] = useState('');
  const [bookingLastName, setBookingLastName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingServiceId, setBookingServiceId] = useState('');
  const [bookingEmployeeId, setBookingEmployeeId] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Service search & filter states
  const [servicesSearch, setServicesSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [servicesSortBy, setServicesSortBy] = useState('default');

  // Reset search and filters when active branch changes using render-time state check (avoids useEffect cascading renders)
  const [prevBranchId, setPrevBranchId] = useState(currentBranchId);
  if (currentBranchId !== prevBranchId) {
    setPrevBranchId(currentBranchId);
    setServicesSearch('');
    setSelectedCategory('All');
    setServicesSortBy('default');
  }

  // Compute dynamic categories based on active services
  const serviceCategories = React.useMemo(() => {
    const set = new Set<string>();
    activeServices.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [activeServices]);

  // Filter and sort active services catalog
  const filteredServices = React.useMemo(() => {
    let result = [...activeServices];

    // Search filter
    if (servicesSearch.trim()) {
      const q = servicesSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || (s.category && s.category.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // Sorting
    if (servicesSortBy === 'price-asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (servicesSortBy === 'price-desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (servicesSortBy === 'duration-asc') {
      result.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (servicesSortBy === 'duration-desc') {
      result.sort((a, b) => b.durationMinutes - a.durationMinutes);
    }

    return result;
  }, [activeServices, servicesSearch, selectedCategory, servicesSortBy]);

  useEffect(() => {
    let active = true;
    const serviceId = bookingServiceId || activeServices[0]?.id;
    if (!bookingDate || !serviceId || !currentBranchId) {
      Promise.resolve().then(() => {
        if (active) {
          setAvailableSlots([]);
        }
      });
      return;
    }
    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const branchId = currentBranchId;
        const employeeQuery = bookingEmployeeId ? `&employeeId=${bookingEmployeeId}` : '';
        const data = await apiClient.get<string[]>(
          `/api/branches/${branchId}/availability?date=${bookingDate}&serviceId=${serviceId}${employeeQuery}`,
          { skipAuth: true }
        );
        if (active) {
          setAvailableSlots(data);
          setBookingStartTime((prev) => {
            if (data.includes(prev)) return prev;
            return data[0] || '';
          });
        }
      } catch (err) {
        console.error('Failed to fetch available slots:', err);
        if (active) {
          setAvailableSlots([]);
          setBookingStartTime('');
        }
      } finally {
        if (active) {
          setIsLoadingSlots(false);
        }
      }
    };

    fetchSlots();
    return () => {
      active = false;
    };
  }, [bookingDate, bookingServiceId, bookingEmployeeId, currentBranchId, activeServices]);

  useEffect(() => {
    // Fallback for browsers that don't support scroll-driven animations
    if (
      !CSS.supports ||
      !CSS.supports('(animation-timeline: view()) and (animation-range: entry)')
    ) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
            }
          });
        },
        { threshold: 0.1 }
      );

      const targets = document.querySelectorAll(
        '.service-front-card, .services-section-title, .quick-info-card'
      );
      targets.forEach((el) => observer.observe(el));

      return () => {
        targets.forEach((el) => observer.unobserve(el));
      };
    }
  }, [activeTab]);

  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = publicWalkinServiceId || activeServices[0]?.id;
    if (!serviceId) return;

    onPublicWalkinSubmit({
      firstName: publicWalkinName,
      lastName: publicWalkinLastName,
      phone: publicWalkinPhone,
      serviceId,
      branchId: currentBranchId,
    });

    setPublicWalkinName('');
    setPublicWalkinLastName('');
    setPublicWalkinPhone('');
    setPublicWalkinServiceId('');
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = bookingServiceId || activeServices[0]?.id;
    const startTime = bookingStartTime || timeSlots[0];

    if (!serviceId || !bookingFirstName || !bookingPhone || !bookingDate || !startTime) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    onPublicBookingSubmit({
      firstName: bookingFirstName,
      lastName: bookingLastName,
      phone: bookingPhone,
      serviceId,
      employeeId: bookingEmployeeId || undefined,
      date: bookingDate,
      startTime,
      branchId: currentBranchId,
    });

    setBookingFirstName('');
    setBookingLastName('');
    setBookingPhone('');
    setBookingServiceId('');
    setBookingEmployeeId('');
    setBookingDate('');
    setBookingStartTime('');
  };
  return (
    <div className="app-container" style={{ display: 'block' }}>
      {/* Top Header Navbar */}
      <header className="public-navbar">
        <div className="public-navbar-logo" onClick={() => navigateTo('/')}>
          <Scissors size={24} className="logo-icon" style={{ transform: 'rotate(-45deg)' }} />
          <span>Nails & Lashes Lane</span>
        </div>
        <div className="public-navbar-actions">
          {branches.length > 0 && (
            <div className="branch-select-container">
              <span className="branch-select-icon-left">
                <MapPin size={15} />
              </span>
              <select
                className="branch-picker-select"
                value={currentBranchId}
                onChange={(e) => {
                  setSelectedBranchId(e.target.value);
                  setBookingServiceId('');
                  setBookingEmployeeId('');
                  setPublicWalkinServiceId('');
                  setBookingStartTime('');
                }}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <span className="branch-select-icon-right">
                <ChevronDown size={14} />
              </span>
            </div>
          )}
          <nav className="public-navbar-links">
            <span
              className={`public-navbar-link ${activeTab === 'public-home' ? 'active' : ''}`}
              onClick={() => setActiveTab('public-home')}
            >
              Home
            </span>
            <span
              className={`public-navbar-link ${activeTab === 'public-services' ? 'active' : ''}`}
              onClick={() => setActiveTab('public-services')}
            >
              Services
            </span>
            <span
              className={`public-navbar-link ${activeTab === 'public-booking' ? 'active' : ''}`}
              onClick={() => setActiveTab('public-booking')}
            >
              Book Now
            </span>
            <span
              className={`public-navbar-link ${activeTab === 'public-walkin' ? 'active' : ''}`}
              onClick={() => setActiveTab('public-walkin')}
            >
              Walk-In
            </span>
            <span
              className={`public-navbar-link ${activeTab === 'public-manage' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('public-manage');
                setLookupPhone('');
                setLookupBookingRef('');
                setLookupResult(null);
                setLookupError('');
                setShowCancelConfirm(false);
              }}
            >
              Manage Booking
            </span>
          </nav>
        </div>
      </header>

      {/* Main Landing content */}
      <main
        className="main-content"
        style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}
      >
        {activeTab === 'public-home' && (
          <div
            className="tab-pane"
            style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}
          >
            <div className="hero-center-container">
              {/* Floating bubbles in the background */}
              <div className="decor-bubble bubble-1">
                <Sparkles size={28} strokeWidth={1.5} />
              </div>
              <div className="decor-bubble bubble-2">
                <Sparkle size={28} strokeWidth={1.5} />
              </div>
              <div className="decor-bubble bubble-3">
                <Gem size={28} strokeWidth={1.5} />
              </div>
              <div className="decor-bubble bubble-4">
                <Heart size={28} strokeWidth={1.5} />
              </div>

              {/* Centered White Card */}
              <div className="hero-center-card">
                <span className="micro-badge">Welcome to Premium Care</span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.03em',
                    fontWeight: 700,
                  }}
                >
                  Nail & Lash perfection at{' '}
                  <span style={{ borderBottom: '2px solid var(--accent)' }}>
                    Nails & Lashes Lane
                  </span>
                </h2>
                <p style={{ color: '#64748B' }}>
                  Experience the art of beauty care with our expert licensed artists. Book your
                  premium session today and let your nails & lashes do the talking.
                </p>
                <button
                  className="btn-primary"
                  onClick={() => setActiveTab('public-booking')}
                  style={{ padding: '14px 36px', fontSize: '15px' }}
                >
                  Book Now
                </button>
              </div>
            </div>

            {/* Centered Services Section */}
            <div>
              <h3 className="services-section-title">Our Services</h3>

              <div className="services-front-grid">
                <div className="service-front-card">
                  <img src={gelExtensionsImg} alt="Gel extensions" className="service-front-img" />
                  <div className="service-front-body">
                    <h4 className="service-front-title">Gel extensions</h4>
                    <p className="service-front-desc">
                      Long-lasting, durable premium nail extensions sculpted custom to your fingers,
                      finished with luxury gel coating and detailing.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const matched = activeServices.find(
                          (s) =>
                            s.name.toLowerCase().includes('extensions') ||
                            s.name.toLowerCase().includes('acrylic')
                        );
                        if (matched) {
                          setBookingServiceId(matched.id);
                        } else if (activeServices.length > 0) {
                          setBookingServiceId(activeServices[0].id);
                        }
                        setActiveTab('public-booking');
                      }}
                      style={{
                        width: '100%',
                        fontSize: '13px',
                        padding: '8px 16px',
                        border: '1px solid var(--accent)',
                        background: 'transparent',
                        color: 'var(--accent)',
                        boxShadow: 'none',
                        marginTop: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--accent-glow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Book Treatment
                    </button>
                  </div>
                </div>

                <div className="service-front-card">
                  <img
                    src={gelPolishImg}
                    alt="Gellack/Shellac/Gel polish"
                    className="service-front-img"
                  />
                  <div className="service-front-body">
                    <h4 className="service-front-title">Gellack/Shellac/Gel polish</h4>
                    <p className="service-front-desc">
                      Chip-resistant, high-shine gel colors cured under UV light for lasting
                      wearability and gorgeous modern gloss.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const matched = activeServices.find(
                          (s) =>
                            s.name.toLowerCase().includes('polish') ||
                            s.name.toLowerCase().includes('gellack') ||
                            s.name.toLowerCase().includes('gel manicure')
                        );
                        if (matched) {
                          setBookingServiceId(matched.id);
                        } else if (activeServices.length > 0) {
                          setBookingServiceId(activeServices[0].id);
                        }
                        setActiveTab('public-booking');
                      }}
                      style={{
                        width: '100%',
                        fontSize: '13px',
                        padding: '8px 16px',
                        border: '1px solid var(--accent)',
                        background: 'transparent',
                        color: 'var(--accent)',
                        boxShadow: 'none',
                        marginTop: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--accent-glow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Book Treatment
                    </button>
                  </div>
                </div>

                <div className="service-front-card">
                  <img
                    src={gelNaturalImg}
                    alt="Gel on natural nails"
                    className="service-front-img"
                  />
                  <div className="service-front-body">
                    <h4 className="service-front-title">Gel on natural nails</h4>
                    <p className="service-front-desc">
                      Strengthen and beautify your natural nails with overlays and cuticle therapy
                      for a clean, elegant growth cycle.
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const matched = activeServices.find(
                          (s) =>
                            s.name.toLowerCase().includes('manicure') ||
                            s.name.toLowerCase().includes('natural') ||
                            s.name.toLowerCase().includes('gel')
                        );
                        if (matched) {
                          setBookingServiceId(matched.id);
                        } else if (activeServices.length > 0) {
                          setBookingServiceId(activeServices[0].id);
                        }
                        setActiveTab('public-booking');
                      }}
                      style={{
                        width: '100%',
                        fontSize: '13px',
                        padding: '8px 16px',
                        border: '1px solid var(--accent)',
                        background: 'transparent',
                        color: 'var(--accent)',
                        boxShadow: 'none',
                        marginTop: 'auto',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--accent-glow)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Book Treatment
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Quick info bar */}
            {(() => {
              const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0];
              return (
                <div className="quick-info-bar">
                  <div className="quick-info-card">
                    <div className="quick-info-icon-wrapper">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <div
                        style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}
                      >
                        Find Us ({currentBranch?.name || 'Main'})
                      </div>
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          wordBreak: 'break-word',
                        }}
                      >
                        {currentBranch?.address ||
                          'Citywalk Tarlac, Tarlac City, Philippines, 2300'}
                      </div>
                    </div>
                  </div>
                  <div className="quick-info-card">
                    <div className="quick-info-icon-wrapper">
                      <Clock size={20} />
                    </div>
                    <div>
                      <div
                        style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}
                      >
                        Salon Hours
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Mon - Sun (10:00 AM - 7:00 PM)
                      </div>
                    </div>
                  </div>
                  <div className="quick-info-card">
                    <div className="quick-info-icon-wrapper">
                      <Globe size={20} />
                    </div>
                    <div>
                      <div
                        style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}
                      >
                        Contact Hotline
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        {currentBranch?.phone || '09175659890'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'public-services' && (
          <div className="glass-panel tab-pane">
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  color: 'var(--accent)',
                  marginTop: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                Our Service Offerings
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Explore our hand-crafted beauty treatments and pricing catalogs.
              </p>
            </div>

            {activeServices.length > 0 ? (
              <>
                {/* Search and Filters Controls Bar */}
                <div className="services-controls-bar">
                  <div className="search-box-wrapper">
                    <Search size={16} className="search-box-icon" />
                    <input
                      type="text"
                      placeholder="Search treatments..."
                      value={servicesSearch}
                      onChange={(e) => setServicesSearch(e.target.value)}
                      className="services-search-input"
                    />
                    {servicesSearch && (
                      <button
                        onClick={() => setServicesSearch('')}
                        className="services-search-clear"
                        type="button"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="services-filters-right">
                    <select
                      value={servicesSortBy}
                      onChange={(e) => setServicesSortBy(e.target.value)}
                      className="services-sort-select"
                    >
                      <option value="default">Sort: Default</option>
                      <option value="price-asc">Price: Low to High</option>
                      <option value="price-desc">Price: High to Low</option>
                      <option value="duration-asc">Duration: Shortest</option>
                      <option value="duration-desc">Duration: Longest</option>
                    </select>
                  </div>
                </div>

                {/* Category Navigation Capsule Tabs */}
                {serviceCategories.length > 1 && (
                  <div className="services-category-tabs">
                    {serviceCategories.map((cat) => (
                      <button
                        key={cat}
                        className={`services-category-tab ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}

                {filteredServices.length > 0 ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '20px',
                      marginTop: '20px',
                    }}
                  >
                    {filteredServices.map((s: Service, index: number) => (
                      <div
                        key={s.id}
                        className="data-card stagger-card"
                        style={{ padding: '24px', '--index': index } as React.CSSProperties}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                          }}
                        >
                          <h4
                            style={{
                              fontWeight: 600,
                              fontSize: '16px',
                              color: 'var(--text-primary)',
                              margin: 0,
                              maxWidth: '70%',
                            }}
                          >
                            {s.name}
                          </h4>
                          <span
                            style={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: 'var(--accent)',
                              fontFamily: 'var(--font-serif)',
                            }}
                          >
                            ₱{Number(s.price).toFixed(2)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '16px',
                          }}
                        >
                          <span
                            className="micro-badge"
                            style={{ fontSize: '9px', padding: '4px 10px' }}
                          >
                            {s.category || 'Nails'}
                          </span>
                          <span
                            className="micro-badge"
                            style={{
                              fontSize: '9px',
                              padding: '4px 10px',
                              backgroundColor: 'rgba(190, 24, 93, 0.04)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            {s.durationMinutes} mins
                          </span>
                        </div>
                        <button
                          className="btn-primary"
                          onClick={() => {
                            setBookingServiceId(s.id);
                            setActiveTab('public-booking');
                          }}
                          style={{
                            width: '100%',
                            fontSize: '13px',
                            padding: '8px 16px',
                            border: '1px solid var(--accent)',
                            background: 'transparent',
                            color: 'var(--accent)',
                            boxShadow: 'none',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-glow)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Book Treatment
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="services-empty-state">
                    <Search size={40} className="empty-icon" />
                    <h4>No services found</h4>
                    <p>
                      We couldn't find any services matching "{servicesSearch}" under category "
                      {selectedCategory}".
                    </p>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setServicesSearch('');
                        setSelectedCategory('All');
                        setServicesSortBy('default');
                      }}
                      style={{ padding: '8px 20px', fontSize: '13px', marginTop: '12px' }}
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px',
                  marginTop: '20px',
                }}
              >
                <div className="data-card" style={{ padding: '24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: 'var(--text-primary)',
                        margin: 0,
                      }}
                    >
                      Classic Gel Manicure
                    </h4>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: 'var(--accent)',
                        fontFamily: 'var(--font-serif)',
                      }}
                    >
                      ₱45.00
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      marginBottom: '16px',
                      lineHeight: '1.4',
                    }}
                  >
                    Long-lasting classic gel polish application includes nail shaping and cuticle
                    care.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      const matched = activeServices.find((s) =>
                        s.name.toLowerCase().includes('classic gel manicure')
                      );
                      if (matched) {
                        setBookingServiceId(matched.id);
                      }
                      setActiveTab('public-booking');
                    }}
                    style={{
                      width: '100%',
                      fontSize: '13px',
                      padding: '8px 16px',
                      border: '1px solid var(--accent)',
                      background: 'transparent',
                      color: 'var(--accent)',
                      boxShadow: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--accent-glow)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Book Treatment
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'public-booking' && lastBookedAppointment && (
          <div
            className="glass-panel tab-pane animate-fade-in"
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              textAlign: 'center',
              padding: '40px 30px',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                marginBottom: '24px',
              }}
            >
              <CheckCircle size={36} />
            </div>

            <h3
              style={{
                fontSize: '24px',
                fontWeight: 700,
                fontFamily: 'var(--font-serif)',
                color: 'var(--text-primary)',
                margin: '0 0 8px 0',
              }}
            >
              Booking Confirmed!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
              Your appointment request has been successfully recorded.
            </p>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'left',
                marginBottom: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Treatment</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {lastBookedAppointment.services?.map((s) => s.service?.name).join(', ') ||
                    'Service'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {new Date(lastBookedAppointment.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'Asia/Manila',
                  })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Time</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {lastBookedAppointment.startTime}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Stylist</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {lastBookedAppointment.employee?.name || 'First Available'}
                </span>
              </div>

              <div
                style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '8px 0' }}
              />

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                  }}
                >
                  Booking Reference ID (save this to cancel/manage)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={lastBookedAppointment.id}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      padding: '10px 12px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '6px',
                      width: '100%',
                      color: 'var(--text-primary)',
                      cursor: 'text',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(lastBookedAppointment.id);
                      showToast('Reference ID copied to clipboard!', 'success');
                    }}
                    className="btn-primary"
                    style={{
                      padding: '0 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--accent)',
                      background: 'transparent',
                      color: 'var(--accent)',
                      boxShadow: 'none',
                    }}
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={clearLastBookedAppointment}
                style={{ padding: '12px 24px' }}
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        )}

        {activeTab === 'public-booking' && !lastBookedAppointment && (
          <div className="glass-panel tab-pane">
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  color: 'var(--accent)',
                  marginTop: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                Schedule an Appointment
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Book your luxury appointment at Nails & Lashes Lane.
              </p>
            </div>
            <form
              onSubmit={handleBookingSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '560px' }}
            >
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={bookingFirstName}
                    onChange={(e) => setBookingFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={bookingLastName}
                    onChange={(e) => setBookingLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 0917 565 9890 or 09175659890"
                  pattern="^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$"
                  title="Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx"
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Requested Treatment *</label>
                <select
                  value={bookingServiceId || activeServices[0]?.id || ''}
                  onChange={(e) => setBookingServiceId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a treatment...
                  </option>
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ₱{Number(s.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time *</label>
                  <select
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                    required
                    disabled={isLoadingSlots || !bookingDate || availableSlots.length === 0}
                  >
                    {!bookingDate && <option value="">Please select a date first</option>}
                    {bookingDate && isLoadingSlots && <option value="">Loading slots...</option>}
                    {bookingDate && !isLoadingSlots && availableSlots.length === 0 && (
                      <option value="">No slots available</option>
                    )}
                    {availableSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {bookingDate && !isLoadingSlots && availableSlots.length === 0 && (
                    <span
                      style={{
                        color: '#ef4444',
                        fontSize: '12px',
                        marginTop: '4px',
                        display: 'block',
                      }}
                    >
                      No available times on this date/stylist.
                    </span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Stylist Preference</label>
                <select
                  value={bookingEmployeeId}
                  onChange={(e) => setBookingEmployeeId(e.target.value)}
                >
                  <option value="">First Available Stylist</option>
                  {activeEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={isBookingAppointment}
                style={{
                  marginTop: '12px',
                  alignSelf: 'flex-start',
                  padding: '14px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isBookingAppointment ? (
                  <>
                    <LoadingSpinner size="sm" color="currentColor" />
                    Submitting Request...
                  </>
                ) : (
                  'Submit Appointment Request'
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'public-walkin' && (
          <div className="glass-panel tab-pane">
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  color: 'var(--accent)',
                  marginTop: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                Live Walk-In Queue Registration
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                No booking? No worries. Add yourself directly to our live daily waitlist at this
                branch.
              </p>
            </div>
            <form
              onSubmit={handleWalkinSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    value={publicWalkinName}
                    onChange={(e) => setPublicWalkinName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    value={publicWalkinLastName}
                    onChange={(e) => setPublicWalkinLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="e.g. 0917 565 9890 or 09175659890"
                  pattern="^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$"
                  title="Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx"
                  value={publicWalkinPhone}
                  onChange={(e) => setPublicWalkinPhone(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Requested Treatment</label>
                <select
                  value={publicWalkinServiceId || activeServices[0]?.id || ''}
                  onChange={(e) => setPublicWalkinServiceId(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a treatment...
                  </option>
                  {activeServices.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - ₱{Number(s.price).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={isAddingWalkin}
                style={{
                  marginTop: '12px',
                  alignSelf: 'flex-start',
                  padding: '14px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {isAddingWalkin ? (
                  <>
                    <LoadingSpinner size="sm" color="currentColor" />
                    Checking In...
                  </>
                ) : (
                  'Check In Now'
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'public-manage' && (
          <div className="glass-panel tab-pane">
            <div style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  color: 'var(--accent)',
                  marginTop: 0,
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 600,
                }}
              >
                Manage Your Booking
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Lookup your appointment details and cancel if you are unable to attend.
              </p>
            </div>

            {!lookupResult ? (
              <form
                onSubmit={handleLookupSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}
              >
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0917 565 9890"
                    pattern="^(09\d{9}|09\d{2}\s\d{3}\s\d{4})$"
                    title="Phone number must be in format 09xxxxxxxxx or 09xx xxx xxxx"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Booking Reference ID (UUID) *</label>
                  <input
                    type="text"
                    placeholder="Enter your 36-character Booking Reference ID"
                    value={lookupBookingRef}
                    onChange={(e) => setLookupBookingRef(e.target.value)}
                    required
                  />
                </div>

                {lookupError && (
                  <div
                    style={{
                      color: '#ef4444',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>⚠️</span> {lookupError}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSearching}
                  style={{
                    marginTop: '12px',
                    alignSelf: 'flex-start',
                    padding: '14px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isSearching ? (
                    <>
                      <LoadingSpinner size="sm" color="currentColor" />
                      Searching...
                    </>
                  ) : (
                    'Find Appointment'
                  )}
                </button>
              </form>
            ) : (
              <div style={{ maxWidth: '600px' }}>
                <div className="data-card" style={{ padding: '24px', marginBottom: '24px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}
                  >
                    <h4
                      style={{
                        margin: 0,
                        fontSize: '18px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      Appointment Details
                    </h4>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        background:
                          lookupResult.status === 'CANCELLED'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : lookupResult.status === 'COMPLETED'
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(59, 130, 246, 0.1)',
                        color:
                          lookupResult.status === 'CANCELLED'
                            ? '#ef4444'
                            : lookupResult.status === 'COMPLETED'
                              ? '#10b981'
                              : '#3b82f6',
                      }}
                    >
                      {lookupResult.status}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      fontSize: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Client Name</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lookupResult.client?.firstName} {lookupResult.client?.lastName || ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Phone Number</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lookupResult.client?.phoneNumber}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Treatment</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lookupResult.services?.map((s) => s.service?.name).join(', ') || 'N/A'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Price</span>
                      <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                        ₱
                        {lookupResult.services
                          ?.reduce((sum: number, s) => sum + Number(s.service?.price || 0), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Branch</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {branches.find((b) => b.id === lookupResult.branchId)?.name ||
                          'Main Branch'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Date</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {new Date(lookupResult.appointmentDate).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'Asia/Manila',
                        })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Time</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lookupResult.startTime} - {lookupResult.endTime}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Stylist</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                        {lookupResult.employee?.name || 'First Available'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setLookupResult(null)}
                    style={{
                      padding: '12px 24px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: 'var(--text-primary)',
                      boxShadow: 'none',
                    }}
                  >
                    Back to Search
                  </button>

                  {['PENDING', 'CONFIRMED'].includes(lookupResult.status) && (
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setShowCancelConfirm(true)}
                      style={{
                        padding: '12px 24px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        boxShadow: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      }}
                    >
                      Cancel Appointment
                    </button>
                  )}
                </div>

                {showCancelConfirm && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '12px',
                      padding: '24px',
                      marginTop: '24px',
                    }}
                  >
                    <h5
                      style={{
                        margin: '0 0 8px 0',
                        fontSize: '15px',
                        fontWeight: 600,
                        color: '#ef4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Trash2 size={16} /> Confirm Cancellation
                    </h5>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        fontSize: '13.5px',
                        margin: '0 0 20px 0',
                        lineHeight: 1.5,
                      }}
                    >
                      Are you sure you want to cancel this appointment? This action cannot be
                      undone.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={isCanceling}
                        onClick={handleCancelConfirm}
                        style={{
                          padding: '10px 20px',
                          background: '#ef4444',
                          color: '#fff',
                          border: 'none',
                          fontSize: '13px',
                        }}
                      >
                        {isCanceling ? (
                          <>
                            <LoadingSpinner size="sm" color="currentColor" />
                            Canceling...
                          </>
                        ) : (
                          'Yes, Cancel Appointment'
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => setShowCancelConfirm(false)}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'var(--text-secondary)',
                          boxShadow: 'none',
                          fontSize: '13px',
                        }}
                      >
                        Keep Booking
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Public Footer */}
        {(() => {
          const currentBranch = branches.find((b) => b.id === currentBranchId) || branches[0];
          return (
            <footer className="public-footer">
              <div>Nails & Lashes Lane &copy; 2014. All rights reserved.</div>
              <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
                Contact ({currentBranch?.name || 'Main'}): {currentBranch?.phone || '09175659890'} |
                Open Monday - Sunday: 10:00 AM - 7:00 PM
              </div>
              <div className="portal-links-row">
                <span className="portal-link" onClick={() => navigateTo('/login')}>
                  Management Portal
                </span>
              </div>
            </footer>
          );
        })()}
      </main>
    </div>
  );
}
