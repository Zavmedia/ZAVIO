import React, { useState } from 'react';
import { X, Plus, Trash2, Command, Save } from 'lucide-react';
import { VoiceShortcut } from '../types';

interface ShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: VoiceShortcut[];
  onSave: (shortcuts: VoiceShortcut[]) => void;
}

const ShortcutModal: React.FC<ShortcutModalProps> = ({ isOpen, onClose, shortcuts, onSave }) => {
  const [localShortcuts, setLocalShortcuts] = useState<VoiceShortcut[]>(shortcuts);
  const [newTrigger, setNewTrigger] = useState('');
  const [newCommand, setNewCommand] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newTrigger.trim() || !newCommand.trim()) return;
    const newShortcut: VoiceShortcut = {
      id: crypto.randomUUID(),
      trigger: newTrigger.trim(),
      command: newCommand.trim()
    };
    setLocalShortcuts([...localShortcuts, newShortcut]);
    setNewTrigger('');
    setNewCommand('');
  };

  const handleDelete = (id: string) => {
    setLocalShortcuts(localShortcuts.filter(s => s.id !== id));
  };

  const handleSave = () => {
    onSave(localShortcuts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/95 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0A0C10] border border-[#78909C] relative shadow-[0_0_50px_rgba(0,229,255,0.1)] flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-[#78909C]/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Command className="text-[#00E5FF]" size={20} />
            <h2 className="text-lg font-bold tracking-[0.2em] text-[#E0E0E0]">MACRO_CONFIG</h2>
          </div>
          <button onClick={onClose} className="text-[#78909C] hover:text-[#FF5252]">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-[10px] text-[#78909C] uppercase tracking-widest mb-6">
            Map voice triggers to complex execution strings. System will auto-replace detected triggers.
          </p>

          {/* List */}
          <div className="space-y-2 mb-6">
             {localShortcuts.length === 0 && (
                <div className="text-center p-8 border border-dashed border-[#78909C]/20 text-[#546E7A] text-xs">
                    NO MACROS DEFINED
                </div>
             )}
             {localShortcuts.map(s => (
               <div key={s.id} className="flex items-center gap-4 p-3 bg-[#263238]/30 border border-[#78909C]/10 hover:border-[#00E5FF]/50 transition-colors group">
                  <div className="w-1/3">
                    <span className="text-[10px] text-[#546E7A] uppercase block">Voice Trigger</span>
                    <span className="text-[#00E5FF] font-mono text-sm">"{s.trigger}"</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] text-[#546E7A] uppercase block">Executes Command</span>
                    <span className="text-[#E0E0E0] font-mono text-xs truncate block">{s.command}</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(s.id)}
                    className="text-[#546E7A] hover:text-[#FF5252] opacity-0 group-hover:opacity-100 transition-opacity p-2"
                  >
                    <Trash2 size={16} />
                  </button>
               </div>
             ))}
          </div>

          {/* Add New */}
          <div className="p-4 bg-[#263238]/20 border border-[#78909C]/20 mt-auto">
             <div className="flex flex-col md:flex-row gap-4 mb-4">
               <div className="flex-1">
                 <label className="text-[10px] text-[#546E7A] uppercase mb-1 block">Voice Trigger (Detected Text)</label>
                 <input 
                    type="text" 
                    value={newTrigger}
                    onChange={e => setNewTrigger(e.target.value)}
                    placeholder="e.g. System Status"
                    className="w-full bg-[#0A0C10] border border-[#78909C]/30 text-[#E0E0E0] p-2 text-sm font-mono focus:border-[#00E5FF] focus:outline-none"
                 />
               </div>
               <div className="flex-[2]">
                 <label className="text-[10px] text-[#546E7A] uppercase mb-1 block">Command String</label>
                 <input 
                    type="text" 
                    value={newCommand}
                    onChange={e => setNewCommand(e.target.value)}
                    placeholder="e.g. Run full diagnostics on server cluster A"
                    className="w-full bg-[#0A0C10] border border-[#78909C]/30 text-[#E0E0E0] p-2 text-sm font-mono focus:border-[#00E5FF] focus:outline-none"
                 />
               </div>
             </div>
             <button 
                onClick={handleAdd}
                disabled={!newTrigger || !newCommand}
                className="w-full py-2 bg-[#78909C]/10 border border-[#78909C] text-[#E0E0E0] hover:bg-[#00E5FF] hover:text-[#0A0C10] hover:border-[#00E5FF] transition-colors text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-[#E0E0E0] disabled:hover:border-[#78909C]"
             >
                <Plus size={14} />
                Add Macro
             </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#78909C]/20 flex justify-end gap-4 bg-[#0D1016]">
            <button 
                onClick={onClose}
                className="px-6 py-2 text-xs text-[#78909C] hover:text-[#E0E0E0] uppercase tracking-widest transition-colors"
            >
                Cancel
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-[#00E5FF] text-[#0A0C10] font-bold text-xs uppercase tracking-widest hover:bg-[#00B8D4] transition-colors flex items-center gap-2"
            >
                <Save size={14} />
                Save Config
            </button>
        </div>

      </div>
    </div>
  );
};

export default ShortcutModal;