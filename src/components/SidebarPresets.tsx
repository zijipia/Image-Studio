import React, { useState, useEffect, useMemo } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Plus,
  Trash2,
  Sparkles,
  Check,
  FolderHeart,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
} from "lucide-react";
import {
  getBuiltinPresets,
  loadUserPresets,
  saveUserPreset,
  deleteUserPreset,
  type PresetGeneratorType,
  type StoredPreset,
} from "../lib/generator-presets";

interface SidebarPresetsProps {
  generatorType: PresetGeneratorType;
  currentData: any;
  onLoadPreset: (presetData: any, presetName: string) => void;
}

export function SidebarPresets({
  generatorType,
  currentData,
  onLoadPreset,
}: SidebarPresetsProps) {
  const [activeTab, setActiveTab] = useState<"builtin" | "user">("builtin");
  const [userPresets, setUserPresets] = useState<StoredPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [presetNameInput, setPresetNameInput] = useState<string>("");
  const [presetDescInput, setPresetDescInput] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load user presets from localStorage whenever generatorType changes
  useEffect(() => {
    const list = loadUserPresets(generatorType);
    setUserPresets(list);
    setActivePresetId(null);
  }, [generatorType]);

  const builtinPresets = useMemo(
    () => getBuiltinPresets(generatorType),
    [generatorType]
  );

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleApplyPreset = (preset: StoredPreset) => {
    setActivePresetId(preset.id);
    onLoadPreset(preset.data, preset.name);
    showFeedback(`Đã áp dụng mẫu: "${preset.name}"`);
  };

  const handleSaveCurrent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetNameInput.trim()) return;

    let badge = "Custom";
    if (generatorType === "song") {
      const count = currentData?.songs?.length || 0;
      badge = `${currentData?.layout || "list"} · ${count} Tracks`;
    } else if (generatorType === "leaderboard") {
      const count = currentData?.items?.length || 0;
      badge = `Top ${count} · ${currentData?.guildName || "Guild"}`;
    } else if (generatorType === "profile") {
      badge = `${currentData?.rank || "#1"} · Lv.${currentData?.level || 1}`;
    } else if (generatorType === "quote") {
      badge = currentData?.author || "Quote";
    }

    const saved = saveUserPreset(
      generatorType,
      presetNameInput.trim(),
      presetDescInput.trim() || `Saved on ${new Date().toLocaleDateString()}`,
      currentData,
      badge
    );

    setUserPresets((prev) => [saved, ...prev]);
    setActivePresetId(saved.id);
    setShowSaveModal(false);
    setPresetNameInput("");
    setPresetDescInput("");
    setActiveTab("user");
    showFeedback(`Đã lưu preset "${saved.name}" vào Local Storage!`);
  };

  const handleDeleteUserPreset = (presetId: string, name: string) => {
    deleteUserPreset(generatorType, presetId);
    setUserPresets((prev) => prev.filter((p) => p.id !== presetId));
    if (activePresetId === presetId) setActivePresetId(null);
    showFeedback(`Đã xóa preset "${name}"`);
  };

  // Color theme according to generatorType
  const themeColor =
    generatorType === "song"
      ? {
          border: "border-purple-500/20",
          bg: "bg-purple-950/20",
          accent: "text-purple-400",
          btn: "bg-purple-600 hover:bg-purple-500",
          pillActive: "bg-purple-600 text-white shadow-purple-900/40",
          ring: "ring-purple-400",
        }
      : generatorType === "profile"
      ? {
          border: "border-rose-500/20",
          bg: "bg-rose-950/20",
          accent: "text-rose-400",
          btn: "bg-rose-600 hover:bg-rose-500",
          pillActive: "bg-rose-600 text-white shadow-rose-900/40",
          ring: "ring-rose-400",
        }
      : generatorType === "leaderboard"
      ? {
          border: "border-amber-500/20",
          bg: "bg-amber-950/20",
          accent: "text-amber-400",
          btn: "bg-amber-600 hover:bg-amber-500",
          pillActive: "bg-amber-600 text-white shadow-amber-900/40",
          ring: "ring-amber-400",
        }
      : {
          border: "border-indigo-500/20",
          bg: "bg-indigo-950/20",
          accent: "text-indigo-400",
          btn: "bg-indigo-600 hover:bg-indigo-500",
          pillActive: "bg-indigo-600 text-white shadow-indigo-900/40",
          ring: "ring-indigo-400",
        };

  return (
    <div
      className={`rounded-xl border ${themeColor.border} ${themeColor.bg} p-3.5 transition-all space-y-3`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 border border-white/10 text-white">
            <BookmarkCheck className={`h-4 w-4 ${themeColor.accent}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                Presets & Mẫu Cấu Hình
              </span>
              {feedbackMsg && (
                <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300 border border-emerald-500/30 animate-fade-in">
                  {feedbackMsg}
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">
              Lưu & nạp nhanh cấu hình từ Local Storage
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setPresetNameInput("");
              setShowSaveModal(true);
            }}
            className={`flex items-center gap-1 rounded-lg ${themeColor.btn} px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition`}
            title="Lưu cấu hình hiện tại thành preset trong Local Storage"
          >
            <Plus className="h-3 w-3" />
            <span>Lưu mẫu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-slate-400 hover:text-white hover:bg-white/5 transition"
            title={isCollapsed ? "Mở rộng danh sách preset" : "Thu gọn"}
          >
            {isCollapsed ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronUp className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="space-y-2.5 pt-1">
          {/* Tabs: Built-in Templates vs My Saved Presets */}
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab("builtin")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  activeTab === "builtin"
                    ? `${themeColor.pillActive} font-semibold shadow-sm`
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Mẫu có sẵn ({builtinPresets.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("user")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition ${
                  activeTab === "user"
                    ? `${themeColor.pillActive} font-semibold shadow-sm`
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <FolderHeart className="h-3 w-3" />
                <span>Đã lưu của tôi ({userPresets.length})</span>
              </button>
            </div>

            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
              localStorage
            </span>
          </div>

          {/* Preset Cards List */}
          {activeTab === "builtin" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {builtinPresets.map((p) => {
                const isActive = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`group relative flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all ${
                      isActive
                        ? `border-white/40 bg-black/60 shadow-md ring-1 ${themeColor.ring}`
                        : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/50"
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold text-white group-hover:text-purple-200 transition">
                        {p.name}
                      </span>
                      {isActive ? (
                        <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30">
                          <Check className="h-2.5 w-2.5" />
                          <span>Đang dùng</span>
                        </span>
                      ) : (
                        p.badge && (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-white/5">
                            {p.badge}
                          </span>
                        )
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 leading-relaxed">
                      {p.description}
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div>
              {userPresets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-4 text-center">
                  <Bookmark className="mx-auto h-5 w-5 text-slate-500 mb-1" />
                  <p className="text-xs font-semibold text-slate-300">
                    Chưa có preset nào được lưu
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Bạn có thể chỉnh sửa cấu hình rồi bấm <strong>"+ Lưu mẫu"</strong> để lưu vào trình duyệt.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-0.5">
                  {userPresets.map((p) => {
                    const isActive = activePresetId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`group relative flex flex-col justify-between gap-1.5 rounded-xl border p-2.5 text-left transition-all ${
                          isActive
                            ? `border-white/40 bg-black/60 shadow-md ring-1 ${themeColor.ring}`
                            : "border-white/10 bg-black/30 hover:border-white/20 hover:bg-black/50"
                        }`}
                      >
                        <div
                          onClick={() => handleApplyPreset(p)}
                          className="cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white group-hover:text-purple-200 transition">
                              {p.name}
                            </span>
                            {isActive ? (
                              <span className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-semibold text-emerald-400 border border-emerald-500/30">
                                <Check className="h-2.5 w-2.5" />
                                <span>Đang dùng</span>
                              </span>
                            ) : (
                              p.badge && (
                                <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-medium text-slate-400 border border-white/5 truncate max-w-[100px]">
                                  {p.badge}
                                </span>
                              )
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 line-clamp-1">
                            {p.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset(p)}
                            className="text-[10px] font-semibold text-purple-400 hover:text-purple-300 transition"
                          >
                            Nạp mẫu này →
                          </button>
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDeleteUserPreset(p.id, p.name);
                            }}
                            className="text-slate-500 hover:text-red-400 transition p-0.5 rounded"
                            title="Xóa preset này khỏi Local Storage"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Save Preset Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#120d26] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
                  <Bookmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Lưu Preset Mới vào Local Storage
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Lưu toàn bộ thông số hiện tại của {generatorType.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCurrent} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-200">
                  Tên Preset <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={presetNameInput}
                  onChange={(e) => setPresetNameInput(e.target.value)}
                  placeholder="Ví dụ: Bảng Xếp Hạng Mùa 2, Profile Neon Cyber..."
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-200">
                  Mô tả / Ghi chú (tùy chọn)
                </label>
                <input
                  type="text"
                  value={presetDescInput}
                  onChange={(e) => setPresetDescInput(e.target.value)}
                  placeholder="Ví dụ: Thiết kế dành riêng cho server Discord chính"
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-black/30 p-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Dữ liệu sẽ được lưu an toàn trong:</span>
                <span className="font-mono text-purple-300">Local Storage</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 rounded-xl ${themeColor.btn} px-4 py-1.5 text-xs font-bold text-white shadow-md transition`}
                >
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Lưu Preset</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
