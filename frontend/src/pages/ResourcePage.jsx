import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Plus, FileText, Phone, ExternalLink, MapPin, LayoutGrid, Map as MapIcon,
  Columns2, Trash2, Pencil, ArrowUpToLine, ArrowDownToLine, CalendarDays,
  Search, X, Clock, Globe, Brain, Stethoscope,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import { Button, Input, Textarea, Select } from '../ui';
import PageShell from '../ui/PageShell';
import { PageShellSkeleton } from '../components/skeleton';
import Modal from '../ui/Modal';
import RoleGate from '../components/RoleGate';
import EmptyState from '../ui/EmptyState';
import { toast } from 'react-toastify';

const RESOURCE_TYPES = [
  { value: 'hotline', label: 'Emergency Hotline' },
  { value: 'psychiatrist', label: 'Psychiatrist' },
  { value: 'psychologist', label: 'Psychologist' },
  { value: 'location', label: 'Physical Center' },
];

const TYPE_ICONS = { hotline: Phone, location: MapPin, psychologist: Brain, psychiatrist: Stethoscope };
const TYPE_LABELS = { hotline: 'Hotline', location: 'Center', psychologist: 'Psychologist', psychiatrist: 'Psychiatrist' };

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MAP_CENTER = [13.1391, 123.7438];
const MAP_ZOOM = 12;
const ALBAY_BOUNDS = L.latLngBounds([12.8, 123.3], [13.6, 124.2]);

// Marker colors track the Evergreen tokens so they stay visible in dark
// mode; cssRgb reads the live CSS variable at draw time.
const cssRgb = (name, fallback) => {
  if (typeof window === 'undefined') return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

const createMarkerIcon = (type, isSelected) => {
  const dark = document.documentElement.classList.contains('dark');
  const colors = {
    hotline: `rgb(${cssRgb('--c-ink-muted', '119 130 125')})`,
    location: dark ? `rgb(${cssRgb('--c-brand-300', '110 231 183')})` : '#171717',
    psychologist: `rgb(${cssRgb('--c-ink-soft', '74 85 81')})`,
    psychiatrist: `rgb(${cssRgb('--c-ink-soft', '74 85 81')})`,
  };
  const color = colors[type] || colors.psychologist;
  const border = isSelected ? (dark ? `rgb(${cssRgb('--c-brand-400', '52 211 153')})` : '#000000') : color;
  const fill = isSelected ? (dark ? `rgb(${cssRgb('--c-brand-600', '5 150 105')})` : '#171717') : `rgb(${cssRgb('--c-surface', '255 255 255')})`;
  const ring = dark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.08)';
  const size = isSelected ? 16 : 12;
  const half = size / 2;

  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${fill};
      border: 2px solid ${border};
      border-radius: 50%;
      box-shadow: ${isSelected ? `0 0 0 4px ${ring}` : 'none'};
      transition: all 0.2s ease;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [half, half],
    popupAnchor: [0, -half],
  });
};

const MapBoundsUpdater = ({ resources, selectedId }) => {
  const map = useMap();
  const prevSelected = useRef(null);

  useEffect(() => {
    if (!selectedId || selectedId === prevSelected.current) return;
    prevSelected.current = selectedId;
    const res = resources.find((r) => r._id === selectedId);
    if (res?.lat != null && res?.lng != null) {
      map.flyTo([res.lat, res.lng], 15, { duration: 0.6 });
    }
  }, [selectedId, resources, map]);

  return null;
};

const ResourceMap = ({ resources, selectedId, onSelect }) => {
  const locations = resources.filter((r) => r.lat != null && r.lng != null);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-line relative z-0 shadow-e1">
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={10}
        maxBounds={ALBAY_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=cb1_2ewm_1_565ab8c78182c1772fdc12fc"
        />
        <MapBoundsUpdater resources={resources} selectedId={selectedId} />
        {locations.map((r) => (
          <Marker
            key={r._id}
            position={[r.lat, r.lng]}
            icon={createMarkerIcon(r.type, r._id === selectedId)}
            eventHandlers={{ click: () => onSelect(r) }}
          >
            <Popup>
              <div className="font-sans text-xs leading-relaxed min-w-[180px]">
                <p className="text-xs font-semibold text-ink mb-0.5">{r.title}</p>
                {r.description && <p className="text-ink-soft mt-1">{r.description}</p>}
                {r.address && <p className="text-ink-muted mt-1">{r.address}</p>}
                {r.hours && <p className="text-ink-muted mt-0.5">{r.hours}</p>}
                {r.contact && <p className="text-ink-muted mt-0.5">{r.contact}</p>}
                <p className="text-ink-muted mt-1.5 text-xs">{TYPE_LABELS[r.type]}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Card — selection highlights, actions live in a corner cluster
   that fades in on hover (always visible on touch screens).
   ───────────────────────────────────────────────────────────── */
const ResourceCard = ({ resource, onEdit, onDelete, onSelect, isSelected, isCounselor, onMoveUp, onMoveDown }) => {
  const Icon = TYPE_ICONS[resource.type] || FileText;
  const isMappable = resource.lat != null && resource.lng != null;

  return (
    <article
      onClick={() => onSelect(resource)}
      className={`group bg-surface border rounded-xl relative transition-all duration-150 p-5 h-full flex flex-col cursor-default ${
        isSelected
          ? 'border-brand-600 ring-2 ring-brand-600/15 shadow-e2'
          : 'border-line hover:border-line-strong hover:shadow-e1'
      }`}
    >
      {isCounselor && (
        <div
          className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 rounded-lg border border-line
            bg-raised/95 backdrop-blur px-1 py-0.5 shadow-e1 opacity-0 group-hover:opacity-100
            focus-within:opacity-100 max-md:opacity-100 transition-opacity"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(resource._id); }}
            className="size-6 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-line transition-colors"
            title="Move up"
            aria-label={`Move ${resource.title} up`}
          >
            <ArrowUpToLine size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(resource._id); }}
            className="size-6 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-line transition-colors"
            title="Move down"
            aria-label={`Move ${resource.title} down`}
          >
            <ArrowDownToLine size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
            className="size-6 flex items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-line transition-colors"
            title="Edit"
            aria-label={`Edit ${resource.title}`}
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(resource._id); }}
            className="size-6 flex items-center justify-center rounded-md text-ink-muted hover:text-danger-ink hover:bg-danger-soft transition-colors"
            title="Delete"
            aria-label={`Delete ${resource.title}`}
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
            isSelected ? 'bg-brand-600 text-brand-fg' : 'bg-line text-ink-muted'
          }`}
        >
          <Icon size={15} />
        </div>
        <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
          {TYPE_LABELS[resource.type]}
        </span>
      </div>

      <h3 className="text-sm font-medium text-ink mb-1.5">{resource.title}</h3>
      <p className="text-xs text-ink-muted leading-relaxed flex-1 line-clamp-3">{resource.description}</p>

      {(resource.contact || resource.address || resource.hours) && (
        <div className="mt-3 space-y-1.5">
          {resource.contact && (
            <a
              href={`tel:${resource.contact.replace(/\s/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-soft hover:text-ink hover:underline underline-offset-2 transition-colors"
            >
              <Phone size={12} className="text-ink-muted shrink-0" /> {resource.contact}
            </a>
          )}
          {resource.address && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <MapPin size={12} className="text-ink-muted shrink-0" /> <span className="truncate">{resource.address}</span>
            </p>
          )}
          {resource.hours && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              <CalendarDays size={12} className="text-ink-muted shrink-0" /> {resource.hours}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-line">
        {resource.date && <span className="text-xs text-ink-muted">{formatDate(resource.date)}</span>}
        <div className="flex items-center gap-2.5">
          {isMappable && (
            <span title="Shown on map">
              <MapPin size={11} className="text-ink-muted" />
              <span className="sr-only">Shown on map</span>
            </span>
          )}
          {resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-ink hover:text-brand-600 transition-colors inline-flex items-center gap-1"
            >
              Open <ExternalLink size={10} />
            </a>
          )}
        </div>
      </div>
    </article>
  );
};

const ResourceGrid = ({ resources, onSelect, selectedId, onEdit, onDelete, isCounselor, onMoveUp, onMoveDown }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
    {resources.map((r) => (
      <ResourceCard
        key={r._id}
        resource={r}
        isSelected={selectedId === r._id}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        isCounselor={isCounselor}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Detail panel — full description and contact rows for the
   selected resource, replacing the old grid-only selection.
   ───────────────────────────────────────────────────────────── */
const DetailRow = ({ icon: Icon, children, href }) => {
  const content = (
    <>
      <Icon size={14} className="text-ink-muted shrink-0" aria-hidden="true" />
      <span className="text-xs text-ink-soft">{children}</span>
    </>
  );
  return href ? (
    <a href={href} className="flex items-start gap-2.5 py-2 group/row">
      {content}
    </a>
  ) : (
    <div className="flex items-start gap-2.5 py-2">{content}</div>
  );
};

const DetailPanel = ({ resource, onEdit, onDelete, isCounselor, onClose }) => {
  if (!resource) return null;
  const Icon = TYPE_ICONS[resource.type] || FileText;
  const isMappable = resource.lat != null && resource.lng != null;

  return (
    <aside
      className="bg-surface border border-line rounded-xl shadow-e1 flex flex-col h-full min-h-0 overflow-hidden"
      aria-label={`Details for ${resource.title}`}
    >
      <div className="relative shrink-0 overflow-hidden bg-side p-5">
        <div aria-hidden="true" className="absolute -right-8 -top-8 size-32 rounded-full bg-side-active blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-side-hover text-side-ink">
              <Icon size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-side-ink-muted">{TYPE_LABELS[resource.type]}</p>
              <h2 className="mt-0.5 text-sm font-semibold leading-snug text-side-ink">{resource.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="shrink-0 flex size-7 items-center justify-center rounded-md text-side-ink-muted hover:text-side-ink hover:bg-side-hover transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5">
        {resource.description && (
          <p className="text-xs leading-relaxed text-ink-soft">{resource.description}</p>
        )}

        <div className="mt-4 divide-y divide-line">
          {resource.contact && (
            <DetailRow icon={Phone} href={`tel:${resource.contact.replace(/\s/g, '')}`}>
              {resource.contact}
            </DetailRow>
          )}
          {resource.address && (
            <DetailRow icon={MapPin}>{resource.address}</DetailRow>
          )}
          {resource.hours && (
            <DetailRow icon={Clock}>{resource.hours}</DetailRow>
          )}
          {resource.url && (
            <DetailRow icon={Globe} href={resource.url}>
              <span className="underline underline-offset-2 group-hover/row:text-brand-600 transition-colors">
                Visit website
              </span>
            </DetailRow>
          )}
        </div>

        {isMappable && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
            <MapPin size={12} className="text-brand-600" /> Highlighted on the map
          </p>
        )}

        {isCounselor && (
          <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => onEdit(resource)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink border border-line-strong rounded-lg hover:border-ink-muted hover:bg-canvas transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(resource._id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-danger-ink border border-danger/30 rounded-lg hover:bg-danger-soft transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

/* ─────────────────────────────────────────────────────────────
   Form modal
   ───────────────────────────────────────────────────────────── */
const FORM_EMPTY = { title: '', type: 'hotline', description: '', url: '', address: '', hours: '', contact: '', mapUrl: '' };

/* Keyed by the parent on `editing` so add vs. edit sessions remount with
   fresh form state — no setState-in-effect reset needed. */
const ResourceFormModal = ({ isOpen, onClose, onSubmit, initial }) => {
  const [form, setForm] = useState(initial ? { ...FORM_EMPTY, ...initial } : FORM_EMPTY);
  const isEdit = !!initial;

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm(FORM_EMPTY);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Resource' : 'Add Resource'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Bicol Region Mental Health Hotline" required />
          <Select
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
            options={RESOURCE_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
        </div>
        <Textarea label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Brief summary of the resource..." rows={3} resize="y" required />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <Input label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
          <Input label="Hours" name="hours" value={form.hours} onChange={handleChange} placeholder="e.g., Mon–Fri 8AM–5PM" />
          <Input label="Contact" name="contact" value={form.contact} onChange={handleChange} placeholder="Phone number" />
        </div>
        {form.type !== 'hotline' && (
          <Input
            label="Google Maps Link"
            name="mapUrl"
            value={form.mapUrl ?? ''}
            onChange={handleChange}
            placeholder="https://www.google.com/maps/..."
            helper="Paste a Google Maps link to drop the pin automatically, or leave it blank to locate the address."
          />
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm">{isEdit ? 'Save Changes' : 'Add Resource'}</Button>
        </div>
      </form>
    </Modal>
  );
};

/* ─────────────────────────────────────────────────────────────
   Page
   ───────────────────────────────────────────────────────────── */
const VIEW_TABS = [
  { key: 'grid', label: 'Grid', icon: LayoutGrid },
  { key: 'split', label: 'Split', icon: Columns2 },
  { key: 'map', label: 'Map', icon: MapIcon },
];

const ResourcePage = () => {
  const { authUser } = useAuthStore();
  const role = authUser?.userType?.toLowerCase() ?? null;
  const isCounselor = role === 'counselor';
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  const normalizeResource = (r) => ({
    ...r,
    type: r.type || 'location',
    lat: r.lat ?? r.location?.lat ?? undefined,
    lng: r.lng ?? r.location?.lng ?? undefined,
    address: r.address || '',
    hours: r.hours || '',
    contact: r.contact || '',
    mapUrl: r.mapUrl || '',
    date: r.date || r.createdAt?.slice(0, 10) || '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get('/resources');
        if (!cancelled) setResources(res.data.map(normalizeResource));
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [reloadToken]);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setModalOpen(true); };

  const handleSubmit = useCallback(async (resource) => {
    try {
      // Coordinate fields only exist for mappable types; don't leak them
      // into hotlines' payloads.
      const payload = { ...resource };
      delete payload.lat;
      delete payload.lng;
      if (resource.type === 'hotline') {
        delete payload.mapUrl;
      }
      let saved;
      if (editing) {
        const res = await axiosInstance.patch(`/resources/${editing._id}`, payload);
        saved = res.data;
        setResources((prev) => prev.map((r) => (r._id === editing._id ? normalizeResource(saved) : r)));
      } else {
        const res = await axiosInstance.post('/resources', payload);
        saved = res.data;
        setResources((prev) => [normalizeResource(saved), ...prev]);
      }
      setModalOpen(false);
      setEditing(null);
      if (saved.type !== 'hotline' && (saved.lat == null || saved.lng == null)) {
        toast.error('Saved, but the address could not be located — edit it to add coordinates');
      } else {
        toast.success(editing ? 'Resource updated' : 'Resource added');
      }
    } catch {
      toast.error('Failed to save resource');
    }
  }, [editing]);

  const handleDelete = useCallback(async (id) => {
    try {
      await axiosInstance.delete(`/resources/${id}`);
      setResources((prev) => prev.filter((r) => r._id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      toast.success('Resource deleted');
    } catch {
      toast.error('Failed to delete resource');
    }
  }, []);

  // Optimistically swap, then persist the new order so it survives a reload.
  const moveResource = useCallback(async (id, direction) => {
    const idx = resources.findIndex((r) => r._id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= resources.length) return;
    const next = [...resources];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setResources(next);
    try {
      const res = await axiosInstance.patch('/resources/reorder', { orderedIds: next.map((r) => r._id) });
      setResources(res.data.map(normalizeResource));
    } catch {
      toast.error('Failed to save the new order');
      refetch();
    }
  }, [resources, refetch]);

  const handleMoveUp = useCallback((id) => moveResource(id, 'up'), [moveResource]);
  const handleMoveDown = useCallback((id) => moveResource(id, 'down'), [moveResource]);

  const handleSelect = useCallback((r) => {
    setSelectedId((prev) => (prev === r._id ? null : r._id));
  }, []);

  /* ── Derived: filtering + search ── */
  const visibleResources = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false;
      if (!q) return true;
      const haystack = [r.title, r.description, r.address, r.contact, TYPE_LABELS[r.type]]
        .filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [resources, query, typeFilter]);

  const selectedResource = useMemo(
    () => visibleResources.find((r) => r._id === selectedId) || null,
    [visibleResources, selectedId],
  );

  const clearFilters = () => { setQuery(''); setTypeFilter('all'); };
  const hasActiveFilters = query.trim() !== '' || typeFilter !== 'all';

  const renderGrid = () => (
    <ResourceGrid
      resources={visibleResources}
      onSelect={handleSelect}
      selectedId={selectedId}
      onEdit={openEdit}
      onDelete={handleDelete}
      isCounselor={isCounselor}
      onMoveUp={handleMoveUp}
      onMoveDown={handleMoveDown}
    />
  );

  const renderEmpty = () => (
    <EmptyState
      icon={hasActiveFilters ? Search : FileText}
      title={hasActiveFilters ? 'No matching resources' : 'No resources yet'}
      description={
        hasActiveFilters
          ? 'Try a different search term or clear the filters.'
          : isCounselor
            ? 'Add wellness resources using the button above.'
            : 'Check back later for wellness resources.'
      }
      action={hasActiveFilters ? (
        <Button size="sm" onClick={clearFilters}>Clear filters</Button>
      ) : undefined}
    />
  );

  if (loading) {
    // PageShellSkeleton draws its own full-page scaffold — wrapping it in
    // PageShell would double the horizontal padding.
    return <PageShellSkeleton count={6} />;
  }

  return (
    <PageShell
      title="Resource Map"
      description="Discover Clinic Centers, Psychiatrists, and Psychologists"
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented view switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-line bg-canvas p-0.5" role="tablist" aria-label="View mode">
            {VIEW_TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={viewMode === key}
                onClick={() => setViewMode(key)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === key
                    ? 'bg-surface text-ink shadow-e1'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
          <RoleGate roles={['counselor']}>
            <Button onClick={openAdd} icon={Plus} size="md">Add Resource</Button>
          </RoleGate>
        </div>
      }
    >
      {/* Toolbar: search + type filters + result count */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resources..."
              aria-label="Search resources"
              className="w-full rounded-lg border border-line bg-surface py-2 pl-9 pr-8 text-sm text-ink
                placeholder:text-ink-muted outline-none transition-colors
                focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-muted hover:text-ink hover:bg-line transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <span className="hidden shrink-0 text-xs text-ink-muted lg:block" aria-live="polite">
            {visibleResources.length} of {resources.length} shown
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by type">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            aria-pressed={typeFilter === 'all'}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              typeFilter === 'all'
                ? 'bg-ink text-canvas border-ink'
                : 'border-line-strong text-ink-muted hover:text-ink hover:border-ink-muted bg-surface'
            }`}
          >
            All
          </button>
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTypeFilter(typeFilter === t.value ? 'all' : t.value)}
              aria-pressed={typeFilter === t.value}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                typeFilter === t.value
                  ? 'bg-ink text-canvas border-ink'
                  : 'border-line-strong text-ink-muted hover:text-ink hover:border-ink-muted bg-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {visibleResources.length === 0 ? (
        renderEmpty()
      ) : viewMode === 'grid' ? (
        renderGrid()
      ) : viewMode === 'map' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 items-stretch">
          <div className="h-[65vh]">
            <ResourceMap resources={visibleResources} selectedId={selectedId} onSelect={handleSelect} />
          </div>
          <div className="h-[60vh] lg:h-[65vh]">
            {selectedResource ? (
              <DetailPanel
                resource={selectedResource}
                onEdit={openEdit}
                onDelete={handleDelete}
                isCounselor={isCounselor}
                onClose={() => setSelectedId(null)}
              />
            ) : (
              <aside className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface/50 p-6 text-center" aria-label="Resource details">
                <MapPin size={20} className="text-ink-muted" aria-hidden="true" />
                <p className="text-xs font-medium text-ink">Select a pin on the map</p>
                <p className="text-xs text-ink-muted max-w-[220px]">Full details for the selected resource will appear here.</p>
              </aside>
            )}
          </div>
        </div>
      ) : (
        /* Split: list + sticky map + live detail panel */
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
          <div className="min-h-0">
            <div className="max-h-[65vh] overflow-y-auto pr-1 -mr-1">
              {renderGrid()}
            </div>
          </div>
          <div className="h-[65vh] lg:sticky lg:top-24 flex flex-col min-h-0 gap-3">
            <div className="flex-1 min-h-0">
              <ResourceMap resources={visibleResources} selectedId={selectedId} onSelect={handleSelect} />
            </div>
            {selectedResource && (
              <div className="shrink-0 h-[220px]">
                <DetailPanel
                  resource={selectedResource}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  isCounselor={isCounselor}
                  onClose={() => setSelectedId(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ResourceFormModal
        key={editing ? `edit-${editing._id}` : 'add'}
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </PageShell>
  );
};

export default ResourcePage;
