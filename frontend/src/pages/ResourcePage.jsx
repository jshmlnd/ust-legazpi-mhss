import { useState, useCallback, useRef, useEffect } from 'react';
import { Plus, FileText, Phone, Download, ExternalLink, MapPin, Grid3X3, Trash2, Pencil, Map, ArrowUpToLine, ArrowDownToLine } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { axiosInstance } from '../lib/axios';
import { useAuthStore } from '../store/useAuthStore';
import PageShell from '../components/PageShell';
import Modal from '../components/Modal';
import FormField from '../components/FormField';
import RoleGate from '../components/RoleGate';
import EmptyState from '../components/EmptyState';
import toast from 'react-hot-toast';

const RESOURCE_TYPES = [
  { value: 'article', label: 'Wellness Article' },
  { value: 'hotline', label: 'Emergency Hotline' },
  { value: 'sheet', label: 'Downloadable Sheet' },
  { value: 'location', label: 'Physical Center' },
];

const TYPE_ICONS = { article: FileText, hotline: Phone, sheet: Download, location: MapPin };
const TYPE_LABELS = { article: 'Article', hotline: 'Hotline', sheet: 'Worksheet', location: 'Center' };

const MAP_CENTER = [13.1391, 123.7438];
const MAP_ZOOM = 12;
const ALBAY_BOUNDS = L.latLngBounds([12.8, 123.3], [13.6, 124.2]);

const createMarkerIcon = (type, isSelected) => {
  const colors = { article: '#525252', hotline: '#a3a3a3', sheet: '#737373', location: '#171717' };
  const color = colors[type] || '#525252';
  const border = isSelected ? '#000000' : color;
  const size = isSelected ? 16 : 12;
  const half = size / 2;

  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${isSelected ? '#171717' : 'white'};
      border: 2px solid ${border};
      border-radius: 50%;
      box-shadow: ${isSelected ? '0 0 0 4px rgba(0,0,0,0.08)' : 'none'};
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
    if (res?.lat && res?.lng) {
      map.flyTo([res.lat, res.lng], 15, { duration: 0.6 });
    }
  }, [selectedId, resources, map]);

  return null;
};

const ResourceMap = ({ resources, selectedId, onSelect }) => {
  const locations = resources.filter((r) => r.lat && r.lng && r.type !== 'article' && r.type !== 'sheet');

  return (
    <div className="h-full w-full rounded-sm overflow-hidden border border-neutral-200">
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
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
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
              <div className="font-sans text-[11px] leading-relaxed min-w-[180px]">
                <p className="text-xs font-semibold text-neutral-900 mb-0.5">{r.title}</p>
                {r.address && <p className="text-neutral-500 mt-1">{r.address}</p>}
                {r.hours && <p className="text-neutral-400 mt-0.5">{r.hours}</p>}
                {r.contact && <p className="text-neutral-500 mt-0.5">{r.contact}</p>}
                <p className="text-neutral-400 mt-1.5 text-[10px] uppercase tracking-[0.05em]">{TYPE_LABELS[r.type]}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

const ResourceCard = ({ resource, onEdit, onDelete, onSelect, isSelected, isCounselor, onMoveUp, onMoveDown }) => {
  const Icon = TYPE_ICONS[resource.type] || FileText;

  return (
    <div
      className={`bg-white border rounded-sm relative transition-colors ${
        isSelected ? 'border-neutral-900 ring-1 ring-neutral-900/10' : 'border-neutral-200'
      }`}
    >
      <div
        className="p-6 h-full flex flex-col cursor-default"
        onClick={() => onSelect(resource)}
      >
        {isCounselor && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(resource._id); }}
              className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900 transition-colors"
              title="Move up"
            >
              <ArrowUpToLine size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(resource._id); }}
              className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900 transition-colors"
              title="Move down"
            >
              <ArrowDownToLine size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(resource); }}
              className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900 transition-colors"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(resource._id); }}
              className="size-7 flex items-center justify-center rounded-sm border border-neutral-200 bg-white text-neutral-400 hover:text-red-600 transition-colors"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="size-8 rounded-sm bg-neutral-100 flex items-center justify-center text-neutral-500">
            <Icon size={15} />
          </div>
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-neutral-400">
            {TYPE_LABELS[resource.type]}
          </span>
        </div>
        <h3 className="text-sm font-medium text-neutral-900 mb-1.5">{resource.title}</h3>
        <p className="text-xs text-neutral-500 leading-relaxed flex-1">{resource.description}</p>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
          <span className="text-[10px] text-neutral-400">{resource.date}</span>
          <div className="flex items-center gap-2">
            {resource.lat && <MapPin size={10} className="text-neutral-300" />}
            <a
              href={resource.url}
              onClick={(e) => e.stopPropagation()}
              className="text-[10px] font-semibold tracking-[0.1em] uppercase text-neutral-900 hover:text-neutral-600 transition-colors inline-flex items-center gap-1"
            >
              {resource.type === 'sheet' ? 'Download' : 'Open'} <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const ResourceGrid = ({ resources, onSelect, selectedId, onEdit, onDelete, isCounselor, onMoveUp, onMoveDown }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-px bg-neutral-200 rounded-sm overflow-hidden">
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

const ResourceFormModal = ({ isOpen, onClose, onSubmit, initial }) => {
  const empty = { title: '', type: 'article', description: '', url: '', address: '', hours: '', contact: '' };
  const [form, setForm] = useState(initial || empty);
  const isEdit = !!initial;

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm(empty);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Resource' : 'Add Resource'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Title" name="title" value={form.title} onChange={handleChange} placeholder="e.g., Stress Management Guide" required />
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500">Type</label>
            <select name="type" value={form.type} onChange={handleChange} className="w-full bg-transparent border border-neutral-200 text-sm rounded-sm px-3 py-2.5 text-neutral-900 focus:border-neutral-900 outline-none transition-colors">
              {RESOURCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <FormField label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} placeholder="Brief summary of the resource..." rows={3} required />
        <FormField label="URL / Link" name="url" value={form.url} onChange={handleChange} placeholder="https://..." />
        {form.type === 'location' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <FormField label="Address" name="address" value={form.address} onChange={handleChange} placeholder="Full address" />
            <FormField label="Hours" name="hours" value={form.hours} onChange={handleChange} placeholder="e.g., Mon–Fri 8AM–5PM" />
            <FormField label="Contact" name="contact" value={form.contact} onChange={handleChange} placeholder="Phone number" />
          </div>
        )}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-neutral-500 hover:text-neutral-900 transition-colors">Cancel</button>
          <button type="submit" className="px-5 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">{isEdit ? 'Save Changes' : 'Add Resource'}</button>
        </div>
      </form>
    </Modal>
  );
};

const ResourcePage = () => {
  const { authUser } = useAuthStore();
  const role = authUser?.userType?.toLowerCase() ?? null;
  const isCounselor = role === 'counselor';
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const normalizeResource = (r) => ({
    ...r,
    type: r.type || 'location',
    lat: r.lat ?? r.location?.lat ?? undefined,
    lng: r.lng ?? r.location?.lng ?? undefined,
    address: r.address || '',
    hours: r.hours || '',
    contact: r.contact || '',
    date: r.date || r.createdAt?.slice(0, 10) || '',
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const res = await axiosInstance.get('/resources');
        setResources(res.data.map(normalizeResource));
      } catch (err) {
        console.error('Failed to fetch resources:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setModalOpen(true); };

  const handleSubmit = useCallback(async (resource) => {
    try {
      if (editing) {
        const res = await axiosInstance.patch(`/resources/${editing._id}`, resource);
        setResources((prev) => prev.map((r) => (r._id === editing._id ? normalizeResource(res.data) : r)));
      } else {
        const res = await axiosInstance.post('/resources', resource);
        setResources((prev) => [normalizeResource(res.data), ...prev]);
      }
      setModalOpen(false);
      setEditing(null);
      toast.success(editing ? 'Resource updated' : 'Resource added');
    } catch (err) {
      toast.error('Failed to save resource');
    }
  }, [editing]);

  const handleDelete = useCallback(async (id) => {
    try {
      await axiosInstance.delete(`/resources/${id}`);
      setResources((prev) => prev.filter((r) => r._id !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      toast.success('Resource deleted');
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  }, []);

  const handleMoveUp = useCallback(async (id) => {
    setResources((prev) => {
      const idx = prev.findIndex((r) => r._id === id);
      if (idx <= 0) return prev;
      const arr = [...prev];
      [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
      return arr;
    });
  }, []);

  const handleMoveDown = useCallback(async (id) => {
    setResources((prev) => {
      const idx = prev.findIndex((r) => r._id === id);
      if (idx < 0 || idx >= prev.length - 1) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
      return arr;
    });
  }, []);

  const handleSelect = useCallback((r) => {
    setSelectedId((prev) => (prev === r._id ? null : r._id));
  }, []);

  if (loading) return <PageShell title="Wellness Resources" subtitle="Articles, hotlines, tools, and physical support centers"><p className="text-sm text-neutral-400">Loading...</p></PageShell>;

  return (
    <PageShell
      title="Wellness Resources"
      subtitle="Articles, hotlines, tools, and physical support centers"
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-neutral-200 rounded-sm overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors flex items-center gap-1.5 ${
                viewMode === 'grid' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Grid3X3 size={12} /> Grid
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors flex items-center gap-1.5 ${
                viewMode === 'map' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Map size={12} /> Map
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-2 text-[10px] font-semibold tracking-[0.1em] uppercase transition-colors flex items-center gap-1.5 ${
                viewMode === 'split' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <MapPin size={12} /> Split
            </button>
          </div>
          <RoleGate roles={['counselor']}>
            <button onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold tracking-[0.1em] uppercase text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-sm">
              <Plus size={14} /> Add Resource
            </button>
          </RoleGate>
        </div>
      }
    >
      {resources.length === 0 ? (
        <EmptyState icon={FileText} title="No resources yet" description={isCounselor ? 'Add wellness resources using the button above.' : 'Check back later for wellness resources.'} />
      ) : viewMode === 'map' ? (
        <div className="h-[65vh] rounded-sm overflow-hidden">
          <ResourceMap resources={resources} selectedId={selectedId} onSelect={handleSelect} />
        </div>
      ) : viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="max-h-[65vh] overflow-y-auto">
            <ResourceGrid
              resources={resources}
              onSelect={handleSelect}
              selectedId={selectedId}
              onEdit={openEdit}
              onDelete={handleDelete}
              isCounselor={isCounselor}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          </div>
          <div className="h-[65vh] rounded-sm overflow-hidden lg:sticky lg:top-[calc(68px+2rem)]">
            <ResourceMap resources={resources} selectedId={selectedId} onSelect={handleSelect} />
          </div>
        </div>
      ) : (
        <ResourceGrid
          resources={resources}
          onSelect={handleSelect}
          selectedId={selectedId}
          onEdit={openEdit}
          onDelete={handleDelete}
          isCounselor={isCounselor}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
        />
      )}

      <ResourceFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSubmit={handleSubmit} initial={editing} />
    </PageShell>
  );
};

export default ResourcePage;
