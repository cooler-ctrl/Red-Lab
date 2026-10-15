import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { EditorToolbar } from './EditorToolbar';
import { ResourceLibrary } from './ResourceLibrary';
import { EditorCanvas } from './EditorCanvas';
import { PropertyInspector } from './PropertyInspector';
import { ScanPanel } from '../security/ScanPanel';
import { useToast } from '../../components/Toast';

export function EditorPage() {
  const { labId } = useParams<{ labId: string }>();
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();

  const loadLab = useEditorStore((s) => s.loadLab);
  const saveLab = useEditorStore((s) => s.saveLab);
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const hasUnsavedChanges = useEditorStore((s) => s.hasUnsavedChanges);
  const lab = useEditorStore((s) => s.lab);

  const [loading, setLoading] = useState(true);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);

  // Load Lab
  useEffect(() => {
    if (!labId) {
      navigate('/');
      return;
    }

    let isMounted = true;
    setLoading(true);

    loadLab(labId)
      .catch((err) => {
        if (isMounted) {
          toastError(`Failed to load lab: ${(err as Error).message}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [labId, loadLab, navigate, toastError]);

  // Keyboard shortcut Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveLab()
          .then(() => toastSuccess('Saved lab'))
          .catch(() => toastError('Failed to save lab'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveLab, toastSuccess, toastError]);

  // Debounced auto-save (every 30 seconds if unsaved changes exist)
  const saveRef = useRef(saveLab);
  saveRef.current = saveLab;

  useEffect(() => {
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveRef.current().catch((err) => {
          console.warn('Auto-save error:', err);
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#0B0D12] flex flex-col items-center justify-center gap-3">
        <Loader2 size={36} className="animate-spin text-[#FF3B4E]" />
        <p className="text-sm font-medium text-[#9BA5B5]">Loading simulation environment...</p>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="h-screen w-screen bg-[#0B0D12] flex flex-col items-center justify-center gap-4 text-center">
        <p className="text-base font-semibold text-[#F3F5F8]">Lab not found</p>
        <p className="text-xs text-[#9BA5B5]">The requested lab could not be found or failed to load.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-[#171C26] border border-[#293140] hover:border-[#FF3B4E] rounded text-xs text-[#F3F5F8] transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0B0D12] text-[#F3F5F8] overflow-hidden select-none">
      {/* Top Toolbar */}
      <EditorToolbar />

      {/* Main Workspace Body */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Library Sidebar */}
        <ResourceLibrary collapsed={libraryCollapsed} />

        {/* Library Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setLibraryCollapsed(!libraryCollapsed)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#171C26] border border-[#293140] hover:border-[#FF3B4E] text-[#9BA5B5] hover:text-[#F3F5F8] p-1 rounded-r shadow-md transition-all"
          style={{ left: libraryCollapsed ? '0px' : '256px' }}
          title={libraryCollapsed ? 'Open Resource Library' : 'Collapse Resource Library'}
        >
          {libraryCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Center Canvas */}
        <main className="flex-1 h-full relative overflow-hidden">
          <EditorCanvas />
        </main>

        {/* Right Inspector Toggle Button (when node selected) */}
        {selectedNodeId && (
          <button
            type="button"
            onClick={() => setInspectorCollapsed(!inspectorCollapsed)}
            className="absolute top-1/2 -translate-y-1/2 z-10 bg-[#171C26] border border-[#293140] hover:border-[#FF3B4E] text-[#9BA5B5] hover:text-[#F3F5F8] p-1 rounded-l shadow-md transition-all"
            style={{ right: inspectorCollapsed ? '0px' : '320px' }}
            title={inspectorCollapsed ? 'Open Property Inspector' : 'Collapse Property Inspector'}
          >
            {inspectorCollapsed ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        )}

        {/* Right Property Inspector Sidebar */}
        <PropertyInspector collapsed={inspectorCollapsed} />
      </div>

      {/* Bottom Scan Results Panel */}
      <ScanPanel />
    </div>
  );
}

export default EditorPage;
