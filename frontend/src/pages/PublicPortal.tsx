import React, { useState, useEffect } from 'react';
import { Scissors, MapPin, Clock, Globe, Sparkles, Sparkle, Gem, Heart } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { ClientAutocomplete } from '../components/common';
import { getApiUrl } from '../utils/getApiUrl';
import { fetchWithTimeout } from '../utils/api';

import gelExtensionsImg from '../assets/gel_extensions.webp';
import gelPolishImg from '../assets/gel_polish.webp';
import gelNaturalImg from '../assets/gel_natural.webp';
import type { Branch, Service, Employee } from '../types';

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
  onPublicWalkinSubmit: (entry: { firstName: string; phone: string; serviceId: string }) => void;
  onPublicBookingSubmit: (entry: {
    firstName: string;
    lastName: string;
    phone: string;
    serviceId: string;
    employeeId?: string;
    date: string;
    startTime: string;
  }) => void;
}

export function PublicPortal({
  activeTab,
  setActiveTab,
  branches,
  navigateTo,
  onPublicWalkinSubmit,
  onPublicBookingSubmit,
}: PublicPortalProps) {
  const { showToast } = useNotification();

  const activeServices = React.useMemo(() => {
    return (branches[0]?.services || []).filter((s) => s.isActive);
  }, [branches]);

  const activeEmployees = React.useMemo(() => {
    return (branches[0]?.employees || []).filter((e) => e.isActive && e.role !== 'OWNER');
  }, [branches]);

  const todayStr = React.useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const timeSlots = React.useMemo(() => TIME_SLOTS, []);

  // Walk-in form state
  const [publicWalkinName, setPublicWalkinName] = useState('');
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

  useEffect(() => {
    let active = true;
    const serviceId = bookingServiceId || activeServices[0]?.id;
    if (!bookingDate || !serviceId || !branches[0]?.id) {
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
        const API_URL = getApiUrl();
        const branchId = branches[0].id;
        const employeeQuery = bookingEmployeeId ? `&employeeId=${bookingEmployeeId}` : '';
        const url = `${API_URL}/api/branches/${branchId}/availability?date=${bookingDate}&serviceId=${serviceId}${employeeQuery}`;
        const res = await fetchWithTimeout(url);
        if (res.ok && active) {
          const data: string[] = await res.json();
          setAvailableSlots(data);
          setBookingStartTime((prev) => {
            if (data.includes(prev)) return prev;
            return data[0] || '';
          });
        } else if (active) {
          setAvailableSlots([]);
          setBookingStartTime('');
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
  }, [bookingDate, bookingServiceId, bookingEmployeeId, branches, activeServices]);

  const handleWalkinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceId = publicWalkinServiceId || activeServices[0]?.id;
    if (!serviceId) return;

    onPublicWalkinSubmit({
      firstName: publicWalkinName,
      phone: publicWalkinPhone,
      serviceId,
    });

    setPublicWalkinName('');
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
          <Scissors size={24} style={{ transform: 'rotate(-45deg)', color: 'var(--accent)' }} />
          <span>Nails & Lashes Lane</span>
        </div>
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
        </nav>
      </header>

      {/* Main Landing content */}
      <main
        className="main-content"
        style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}
      >
        {activeTab === 'public-home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div className="hero-center-container">
              {/* Floating bubbles in the background */}
              <div className="decor-bubble bubble-1">
                <Sparkles size={28} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
              </div>
              <div className="decor-bubble bubble-2">
                <Sparkle size={28} strokeWidth={1.5} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div className="decor-bubble bubble-3">
                <Gem size={28} strokeWidth={1.5} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div className="decor-bubble bubble-4">
                <Heart size={28} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
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
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Quick info bar */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '20px',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '3px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <MapPin size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Find Us
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Citywalk Tarlac, Tarlac City, Philippines, 2300
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Clock size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Salon Hours
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Mon - Sun (10:00 AM - 7:00 PM)
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Globe size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                    Contact Hotline
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    09175659890
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'public-services' && (
          <div className="glass-panel">
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

            {branches[0]?.services && branches[0].services.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px',
                  marginTop: '20px',
                }}
              >
                {branches[0].services.map((s: Service) => (
                  <div key={s.id} className="data-card" style={{ padding: '24px' }}>
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
                      onClick={() => setActiveTab('public-booking')}
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
                    onClick={() => setActiveTab('public-booking')}
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

        {activeTab === 'public-booking' && (
          <div className="glass-panel">
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
                  <ClientAutocomplete
                    value={bookingFirstName}
                    onChange={setBookingFirstName}
                    onSelect={(client) => {
                      setBookingFirstName(client.firstName);
                      setBookingLastName(client.lastName || '');
                      setBookingPhone(client.phoneNumber || '');
                    }}
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={bookingLastName}
                    onChange={(e) => setBookingLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  pattern="[0-9+\-\s().]{7,20}"
                  title="Please enter a valid phone number (digits, spaces, +, -, parentheses)"
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
                style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}
              >
                Submit Appointment Request
              </button>
            </form>
          </div>
        )}

        {activeTab === 'public-walkin' && (
          <div className="glass-panel">
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
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <ClientAutocomplete
                  value={publicWalkinName}
                  onChange={setPublicWalkinName}
                  onSelect={(client) => {
                    setPublicWalkinName(client.firstName);
                    setPublicWalkinPhone(client.phoneNumber || '');
                  }}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  placeholder="(555) 000-0000"
                  pattern="[0-9+\-\s().]{7,20}"
                  title="Please enter a valid phone number (digits, spaces, +, -, parentheses)"
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
                style={{ marginTop: '12px', alignSelf: 'flex-start', padding: '14px 32px' }}
              >
                Check In Now
              </button>
            </form>
          </div>
        )}

        {/* Public Footer */}
        <footer className="public-footer">
          <div>Nails & Lashes Lane &copy; 2014. All rights reserved.</div>
          <div style={{ marginTop: '10px', fontSize: '12.5px' }}>
            Contacts: 09175659890 | Open Monday - Sunday: 10:00 AM - 7:00 PM
          </div>
          <div className="portal-links-row">
            <span className="portal-link" onClick={() => navigateTo('/login')}>
              Management Portal
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
