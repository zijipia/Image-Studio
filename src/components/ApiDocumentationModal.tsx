import React, { useState } from "react";
import {
  Code2,
  X,
  Copy,
  Check,
  Music,
  User,
  Trophy,
  Quote,
  Film,
  Zap,
  Terminal,
  ExternalLink,
  BookOpen,
} from "lucide-react";

interface ApiDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DocSection = "overview" | "song" | "profile" | "leaderboard" | "quote" | "animation" | "stats";
type CodeLang = "curl" | "python" | "nodejs" | "discord";

export function ApiDocumentationModal({ isOpen, onClose }: ApiDocumentationModalProps) {
  const [activeSection, setActiveSection] = useState<DocSection>("overview");
  const [codeLang, setCodeLang] = useState<CodeLang>("curl");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex h-[90vh] max-h-[850px] w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-[#0c0918] shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-[#120d24] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Image Studio API Reference
                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[11px] font-mono font-medium text-purple-300 border border-purple-500/30">
                  v2.0 · REST
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                High-performance Satori & Sharp rendering engine for Discord bots & web services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body: Sidebar + Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-56 shrink-0 border-r border-white/10 bg-[#090614] p-3 overflow-y-auto space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Endpoints
            </div>
            {[
              { id: "overview", label: "Tổng Quan / Overview", icon: Zap, color: "text-amber-400" },
              { id: "song", label: "1. Song Search Card", icon: Music, color: "text-purple-400" },
              { id: "profile", label: "2. Profile & Rank Card", icon: User, color: "text-rose-400" },
              { id: "leaderboard", label: "3. Guild Leaderboard", icon: Trophy, color: "text-amber-400" },
              { id: "quote", label: "4. Quote Card", icon: Quote, color: "text-indigo-400" },
              { id: "animation", label: "5. Animation & Frame", icon: Film, color: "text-fuchsia-400" },
              { id: "stats", label: "6. Stats Counter", icon: Terminal, color: "text-emerald-400" },
            ].map((sec) => {
              const Icon = sec.icon;
              const isSelected = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id as DocSection)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-purple-600/30 text-white font-semibold border border-purple-500/40 shadow-sm"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${sec.color}`} />
                  <span className="truncate">{sec.label}</span>
                </button>
              );
            })}

            <div className="mt-4 pt-3 border-t border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Client Language
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-2">
              {[
                { id: "curl", label: "cURL" },
                { id: "python", label: "Python" },
                { id: "nodejs", label: "Node.js" },
                { id: "discord", label: "Discord Bot" },
              ].map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setCodeLang(lang.id as CodeLang)}
                  className={`rounded-lg py-1 px-2 text-[11px] font-mono font-medium transition-colors ${
                    codeLang === lang.id
                      ? "bg-white/15 text-white shadow-sm border border-white/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-300"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* SECTION: OVERVIEW */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4">
                  <h3 className="text-sm font-semibold text-purple-200 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    Universal Rendering Endpoint: <code>POST /api/generate</code>
                  </h3>
                  <p className="mt-1 text-xs text-purple-300/80 leading-relaxed">
                    Image Studio cung cấp 1 endpoint duy nhất để tạo ảnh static PNG (Song, Profile, Leaderboard, Quote) hoặc animation GIF/WebP. Tất cả các endpoint đều trả về binary stream trực tiếp cùng headers hữu ích như <code>X-Image-Height</code> và <code>X-Total-Generated</code>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="text-xs font-semibold text-white">HTTP Headers</span>
                    <ul className="text-xs text-slate-300 space-y-1 font-mono">
                      <li><strong className="text-purple-300">Content-Type:</strong> application/json</li>
                      <li><strong className="text-purple-300">Accept:</strong> image/png (hoặc image/gif)</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                    <span className="text-xs font-semibold text-white">Response Headers</span>
                    <ul className="text-xs text-slate-300 space-y-1 font-mono">
                      <li><strong className="text-emerald-300">Content-Type:</strong> image/png | image/gif | image/webp</li>
                      <li><strong className="text-emerald-300">X-Total-Generated:</strong> &lt;số đếm toàn server&gt;</li>
                      <li><strong className="text-emerald-300">X-Image-Height:</strong> &lt;chiều cao px&gt;</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Danh Sách Card Studios & Layouts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-3">
                      <div className="font-bold text-purple-300 flex items-center gap-1.5">
                        <Music className="h-4 w-4" /> 1. Song Search Card
                      </div>
                      <p className="mt-1 text-slate-400 text-[11px]">Bảng tìm kiếm bài hát rộng 1130px, hỗ trợ 1-20 bài.</p>
                      <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                        <span className="rounded bg-purple-900/40 px-1.5 py-0.5 text-purple-200">auto</span>
                        <span className="rounded bg-purple-900/40 px-1.5 py-0.5 text-purple-200">list</span>
                        <span className="rounded bg-purple-900/40 px-1.5 py-0.5 text-purple-200">grid</span>
                        <span className="rounded bg-purple-900/40 px-1.5 py-0.5 text-purple-200">classic</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-3">
                      <div className="font-bold text-rose-300 flex items-center gap-1.5">
                        <User className="h-4 w-4" /> 2. Profile & Rank Card
                      </div>
                      <p className="mt-1 text-slate-400 text-[11px]">Thẻ cấp bậc Discord 950×260px với 4 theme nghệ thuật.</p>
                      <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                        <span className="rounded bg-rose-900/40 px-1.5 py-0.5 text-rose-200">ruby-poly</span>
                        <span className="rounded bg-rose-900/40 px-1.5 py-0.5 text-rose-200">cyber-neon</span>
                        <span className="rounded bg-rose-900/40 px-1.5 py-0.5 text-rose-200">glass-minimal</span>
                        <span className="rounded bg-rose-900/40 px-1.5 py-0.5 text-rose-200">gold-legend</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3">
                      <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Trophy className="h-4 w-4" /> 3. Guild Leaderboard
                      </div>
                      <p className="mt-1 text-slate-400 text-[11px]">Bảng xếp hạng server 540px với 4 layout chuyên nghiệp.</p>
                      <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-200">podium</span>
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-200">compact-list</span>
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-200">cyber-grid</span>
                        <span className="rounded bg-amber-900/40 px-1.5 py-0.5 text-amber-200">minimal-cards</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-3">
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Quote className="h-4 w-4" /> 4. Quote Card
                      </div>
                      <p className="mt-1 text-slate-400 text-[11px]">Thẻ trích dẫn 1000×500px với 4 phong cách trình bày.</p>
                      <div className="mt-2 flex flex-wrap gap-1 font-mono text-[10px]">
                        <span className="rounded bg-indigo-900/40 px-1.5 py-0.5 text-indigo-200">split-portrait</span>
                        <span className="rounded bg-indigo-900/40 px-1.5 py-0.5 text-indigo-200">centered-minimal</span>
                        <span className="rounded bg-indigo-900/40 px-1.5 py-0.5 text-indigo-200">modern-card</span>
                        <span className="rounded bg-indigo-900/40 px-1.5 py-0.5 text-indigo-200">neon-cyber</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION: SONG SEARCH */}
            {activeSection === "song" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Music className="h-5 w-5 text-purple-400" />
                      Song Search Card API
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tạo ảnh danh sách kết quả bài hát (1130px chiều rộng, tự động co giãn chiều cao theo số lượng bài)
                    </p>
                  </div>
                  <span className="rounded bg-purple-500/20 px-2 py-1 font-mono text-xs text-purple-300">
                    type: "song"
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-purple-300">Layouts hỗ trợ ("layout"):</h4>
                  <ul className="text-xs space-y-1.5 text-slate-300">
                    <li><code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">"auto"</code>: Tự động chọn layout tối ưu theo số lượng bài (mặc định).</li>
                    <li><code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">"list"</code>: Danh sách ngang với ảnh thumbnail tỷ lệ 16:9 sắc nét, hiển thị views & duration.</li>
                    <li><code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">"grid"</code>: Lưới 2 cột card thumbnail vuông với nút Play nổi bật.</li>
                    <li><code className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">"classic"</code>: Thiết kế bảng tinh gọn kinh điển với ảnh tròn và thông tin nghệ sĩ.</li>
                  </ul>
                </div>

                <CodeBlock
                  lang={codeLang}
                  curl={`curl -X POST ${currentOrigin}/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "song",
    "title": "Top Trending Tracks 2026",
    "layout": "list",
    "items": [
      {
        "index": 1,
        "displayName": "Blinding Lights",
        "author": "The Weeknd",
        "time": "3:20",
        "views": "4.2B views",
        "source": "youtube",
        "avatar": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"
      },
      {
        "index": 2,
        "displayName": "Starboy",
        "author": "The Weeknd ft. Daft Punk",
        "time": "3:50",
        "views": "2.8B views",
        "source": "spotify",
        "avatar": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200"
      }
    ]
  }' \\
  --output song-search.png`}
                  python={`import requests

payload = {
    "type": "song",
    "title": "Top Trending Tracks 2026",
    "layout": "list",  # "auto" | "list" | "grid" | "classic"
    "items": [
        {
            "index": 1,
            "displayName": "Blinding Lights",
            "author": "The Weeknd",
            "time": "3:20",
            "views": "4.2B views",
            "source": "youtube",
            "avatar": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"
        }
    ]
}

res = requests.post("${currentOrigin}/api/generate", json=payload)
if res.status_code == 200:
    with open("songs.png", "wb") as f:
        f.write(res.content)
    print("Exported songs.png successfully!")`}
                  nodejs={`import fs from "fs";

const payload = {
  type: "song",
  title: "Top Trending Tracks 2026",
  layout: "list", // "auto" | "list" | "grid" | "classic"
  items: [
    {
      index: 1,
      displayName: "Blinding Lights",
      author: "The Weeknd",
      time: "3:20",
      views: "4.2B views",
      source: "youtube",
      avatar: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200"
    }
  ]
};

const res = await fetch("${currentOrigin}/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const buffer = await res.arrayBuffer();
fs.writeFileSync("songs.png", Buffer.from(buffer));
console.log("Saved songs.png!");`}
                  discord={`import discord
from discord.ext import commands
import aiohttp
import io

@bot.command()
async def search(ctx, *, query: str):
    # Prepare payload with your search results
    payload = {
        "type": "song",
        "title": f"Results for: {query}",
        "layout": "list",
        "items": [
            {
                "index": i + 1,
                "displayName": track.title,
                "author": track.author,
                "time": track.duration,
                "source": "youtube",
                "avatar": track.thumbnail
            }
            for i, track in enumerate(tracks[:5])
        ]
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("${currentOrigin}/api/generate", json=payload) as resp:
            if resp.status == 200:
                data = await resp.read()
                file = discord.File(io.BytesIO(data), filename="songs.png")
                await ctx.send(file=file)
            else:
                await ctx.send("Failed to render song banner.")`}
                  onCopy={(key, text) => copyToClipboard(text, key)}
                  copiedKey={copiedKey}
                  blockKey="song"
                />
              </div>
            )}

            {/* SECTION: PROFILE */}
            {activeSection === "profile" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <User className="h-5 w-5 text-rose-400" />
                      Profile & Rank Card API
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tạo thẻ cấp bậc thành viên Discord (kích thước chuẩn 950 × 260px) với 4 theme đặc trưng
                    </p>
                  </div>
                  <span className="rounded bg-rose-500/20 px-2 py-1 font-mono text-xs text-rose-300">
                    type: "profile"
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-rose-300">4 Giao diện Mẫu ("theme"):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 p-2.5">
                      <strong className="text-rose-300 font-mono">"ruby-poly" (Mặc định)</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Thẻ đỏ Ruby đa giác góc nghiêng 45°, avatar tròn viền sáng, thanh XP 3D, Lv badge và số dư tài khoản.
                      </p>
                    </div>
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5">
                      <strong className="text-cyan-300 font-mono">"cyber-neon"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Phong cách Cyberpunk Sci-Fi HUD ID, avatar vuông tech, thanh laser quét, telemetry bar và chỉ số NET_WORTH.
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                      <strong className="text-emerald-300 font-mono">"glass-minimal"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Thẻ kính mờ ngọc lục bảo (Emerald Frosted), lưới thông số Matrix cân đối, badge cấp độ bo góc mềm mại.
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                      <strong className="text-amber-300 font-mono">"gold-legend"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Hoàng gia đế vương Gold Sovereign, vương miện hoàng gia, viền vàng kim quý tộc, danh hiệu IMPERIAL.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2 text-xs">
                  <span className="font-semibold text-white">Các trường dữ liệu trong <code>data</code>:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-mono text-[11px] text-slate-300">
                    <div><span className="text-rose-300">username</span> (string): Tên người dùng</div>
                    <div><span className="text-rose-300">rank</span> (string|number): "#1" hoặc 1</div>
                    <div><span className="text-rose-300">level</span> (number): Cấp độ hiện tại</div>
                    <div><span className="text-rose-300">currentXp</span> (number): XP hiện có</div>
                    <div><span className="text-rose-300">requiredXp</span> (number): XP cần để lên cấp</div>
                    <div><span className="text-rose-300">balance</span> (string): Số dư ví xu, ví dụ: "13,080 xu"</div>
                    <div><span className="text-rose-300">badge</span> (string, optional): "★ TOP 1 GUILD"</div>
                    <div><span className="text-rose-300">title</span> (string, optional): "Ruby Grandmaster"</div>
                    <div><span className="text-rose-300">avatar</span> (string): URL ảnh đại diện</div>
                    <div><span className="text-rose-300">theme</span> (string): "ruby-poly" | "cyber-neon" | "glass-minimal" | "gold-legend"</div>
                  </div>
                </div>

                <CodeBlock
                  lang={codeLang}
                  curl={`curl -X POST ${currentOrigin}/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "profile",
    "data": {
      "username": "__ziji",
      "rank": "#1",
      "level": 42,
      "currentXp": 8450,
      "requiredXp": 10000,
      "balance": "13,080 xu",
      "badge": "★ TOP 1 GUILD",
      "title": "Grandmaster",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
      "theme": "cyber-neon"
    }
  }' \\
  --output profile-rank.png`}
                  python={`import requests

payload = {
    "type": "profile",
    "data": {
        "username": "__ziji",
        "rank": "#1",
        "level": 42,
        "currentXp": 8450,
        "requiredXp": 10000,
        "balance": "13,080 xu",
        "badge": "★ TOP 1 GUILD",
        "title": "Grandmaster",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
        "theme": "cyber-neon"  # "ruby-poly" | "cyber-neon" | "glass-minimal" | "gold-legend"
    }
}

res = requests.post("${currentOrigin}/api/generate", json=payload)
if res.status_code == 200:
    with open("profile.png", "wb") as f:
        f.write(res.content)
    print("Saved profile card!")`}
                  nodejs={`import fs from "fs";

const payload = {
  type: "profile",
  data: {
    username: "__ziji",
    rank: "#1",
    level: 42,
    currentXp: 8450,
    requiredXp: 10000,
    balance: "13,080 xu",
    badge: "★ TOP 1 GUILD",
    title: "Grandmaster",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300",
    theme: "cyber-neon"
  }
};

const res = await fetch("${currentOrigin}/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const buffer = await res.arrayBuffer();
fs.writeFileSync("profile.png", Buffer.from(buffer));
console.log("Saved profile.png!");`}
                  discord={`import discord
from discord.ext import commands
import aiohttp
import io

@bot.command()
async def rank(ctx, member: discord.Member = None):
    member = member or ctx.author
    
    # Query your database for user stats
    payload = {
        "type": "profile",
        "data": {
            "username": member.display_name,
            "rank": "#1",
            "level": 42,
            "currentXp": 8500,
            "requiredXp": 10000,
            "balance": "15,000 xu",
            "badge": "VIP MEMBER",
            "avatar": member.display_avatar.url,
            "theme": "gold-legend"  # ruby-poly | cyber-neon | glass-minimal | gold-legend
        }
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("${currentOrigin}/api/generate", json=payload) as resp:
            if resp.status == 200:
                data = await resp.read()
                file = discord.File(io.BytesIO(data), filename="rank.png")
                await ctx.send(file=file)
            else:
                await ctx.send("Failed to render rank card.")`}
                  onCopy={(key, text) => copyToClipboard(text, key)}
                  copiedKey={copiedKey}
                  blockKey="profile"
                />
              </div>
            )}

            {/* SECTION: LEADERBOARD */}
            {activeSection === "leaderboard" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-amber-400" />
                      Guild Leaderboard Card API
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tạo bảng xếp hạng server/guild (540px chiều rộng, tự tính chiều cao) với 4 layout tùy chọn
                    </p>
                  </div>
                  <span className="rounded bg-amber-500/20 px-2 py-1 font-mono text-xs text-amber-300">
                    type: "leaderboard"
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-amber-300">4 Bố Cục Layouts ("layout"):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                      <strong className="text-amber-300 font-mono">"podium" (Mặc định)</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bục vinh quang 3D Olympic Top 1-2-3, vương miện hoàng gia vàng trên vị trí số 1, danh sách Top 4+ phía dưới.
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-2.5">
                      <strong className="text-blue-300 font-mono">"compact-list"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Bảng hàng ngang Discord cổ điển tinh gọn, huy hiệu 🥇🥈🥉, avatar viền màu cấp bậc và XP.
                      </p>
                    </div>
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5">
                      <strong className="text-cyan-300 font-mono">"cyber-grid"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Lưới Cyberpunk 2 cột đấu trường neon, huy hiệu rank góc trên, avatar vuông, chỉ số Lv và XP nhỏ gọn.
                      </p>
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                      <strong className="text-emerald-300 font-mono">"minimal-cards"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Thẻ kính mờ nổi (Frosted Glass), kèm thanh tiến trình XP vi mô phần trăm trực quan theo người dẫn đầu.
                      </p>
                    </div>
                  </div>
                </div>

                <CodeBlock
                  lang={codeLang}
                  curl={`curl -X POST ${currentOrigin}/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "leaderboard",
    "data": {
      "guildName": "Celestial Realm",
      "season": "SEASON 4 · 2026",
      "subtitle": "Global Champions",
      "guildIcon": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
      "layout": "podium",
      "items": [
        { "rank": 1, "username": "Aurelius", "handle": "@aurelius_rex", "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150", "level": 99, "xp": 94820 },
        { "rank": 2, "username": "Valkyrie", "handle": "@valk_prime", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", "level": 88, "xp": 82140 },
        { "rank": 3, "username": "Kage", "handle": "@shadow_blade", "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150", "level": 75, "xp": 67390 }
      ]
    }
  }' \\
  --output leaderboard.png`}
                  python={`import requests

payload = {
    "type": "leaderboard",
    "data": {
        "guildName": "Celestial Realm",
        "season": "SEASON 4",
        "layout": "podium",  # "podium" | "compact-list" | "cyber-grid" | "minimal-cards"
        "guildIcon": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
        "items": [
            {
                "rank": 1,
                "username": "Aurelius",
                "handle": "@aurelius_rex",
                "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                "level": 99,
                "xp": 94820
            }
        ]
    }
}

res = requests.post("${currentOrigin}/api/generate", json=payload)
if res.status_code == 200:
    with open("leaderboard.png", "wb") as f:
        f.write(res.content)
    print("Leaderboard generated!")`}
                  nodejs={`import fs from "fs";

const payload = {
  type: "leaderboard",
  data: {
    guildName: "Celestial Realm",
    season: "SEASON 4",
    layout: "podium", // "podium" | "compact-list" | "cyber-grid" | "minimal-cards"
    guildIcon: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150",
    items: [
      {
        rank: 1,
        username: "Aurelius",
        handle: "@aurelius_rex",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        level: 99,
        xp: 94820
      }
    ]
  }
};

const res = await fetch("${currentOrigin}/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const buffer = await res.arrayBuffer();
fs.writeFileSync("leaderboard.png", Buffer.from(buffer));`}
                  discord={`import discord
from discord.ext import commands
import aiohttp
import io

@bot.command()
async def top(ctx):
    # Fetch top 10 from database
    payload = {
        "type": "leaderboard",
        "data": {
            "guildName": ctx.guild.name,
            "season": "TOP XP",
            "guildIcon": ctx.guild.icon.url if ctx.guild.icon else "",
            "layout": "podium",  # "podium" | "compact-list" | "cyber-grid" | "minimal-cards"
            "items": [
                {
                    "rank": i + 1,
                    "username": u.name,
                    "handle": f"@{u.discriminator}",
                    "avatar": u.display_avatar.url,
                    "level": u.level,
                    "xp": u.xp
                }
                for i, u in enumerate(top_members[:10])
            ]
        }
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("${currentOrigin}/api/generate", json=payload) as resp:
            if resp.status == 200:
                data = await resp.read()
                file = discord.File(io.BytesIO(data), filename="leaderboard.png")
                await ctx.send(file=file)
            else:
                await ctx.send("Failed to render leaderboard.")`}
                  onCopy={(key, text) => copyToClipboard(text, key)}
                  copiedKey={copiedKey}
                  blockKey="leaderboard"
                />
              </div>
            )}

            {/* SECTION: QUOTE */}
            {activeSection === "quote" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Quote className="h-5 w-5 text-indigo-400" />
                      Quote Card API
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tạo thẻ trích dẫn phát ngôn nghệ thuật (kích thước chuẩn 1000 × 500px) với 4 layout tùy chọn
                    </p>
                  </div>
                  <span className="rounded bg-indigo-500/20 px-2 py-1 font-mono text-xs text-indigo-300">
                    type: "quote"
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-indigo-300">4 Phong Cách Bố Cục ("layout"):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-2.5">
                      <strong className="text-indigo-300 font-mono">"split-portrait" (Mặc định)</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Điện ảnh Split Cinema: Chân dung nhân vật bên trái fade đen mượt mà sang nội dung trích dẫn bên phải.
                      </p>
                    </div>
                    <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-2.5">
                      <strong className="text-purple-300 font-mono">"centered-minimal"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tạp chí trang trọng: Căn giữa hoàn mỹ, avatar tròn viền gradient, dấu trích dẫn nghệ thuật chìm mờ phía sau.
                      </p>
                    </div>
                    <div className="rounded-lg border border-blue-500/30 bg-blue-950/20 p-2.5">
                      <strong className="text-blue-300 font-mono">"modern-card"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Thẻ kính nổi 3D (Frosted Card) trên nền mờ nghệ thuật, huy hiệu tác giả tích xanh xác thực.
                      </p>
                    </div>
                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5">
                      <strong className="text-cyan-300 font-mono">"neon-cyber"</strong>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Thiết bị công nghệ Sci-Fi HUD Terminal: Góc ngắm điện tử, thanh đo âm tần và chỉ báo STREAM_ACTIVE.
                      </p>
                    </div>
                  </div>
                </div>

                <CodeBlock
                  lang={codeLang}
                  curl={`curl -X POST ${currentOrigin}/api/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "quote",
    "data": {
      "quote": "Stay hungry, stay foolish.",
      "author": "Steve Jobs",
      "handle": "@stevejobs",
      "tag": "Stanford Speech 2005",
      "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
      "layout": "split-portrait"
    }
  }' \\
  --output quote.png`}
                  python={`import requests

payload = {
    "type": "quote",
    "data": {
        "quote": "Stay hungry, stay foolish.",
        "author": "Steve Jobs",
        "handle": "@stevejobs",
        "tag": "Stanford 2005",
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
        "layout": "split-portrait"  # "split-portrait" | "centered-minimal" | "modern-card" | "neon-cyber"
    }
}

res = requests.post("${currentOrigin}/api/generate", json=payload)
if res.status_code == 200:
    with open("quote.png", "wb") as f:
        f.write(res.content)
    print("Quote saved!")`}
                  nodejs={`import fs from "fs";

const payload = {
  type: "quote",
  data: {
    quote: "Stay hungry, stay foolish.",
    author: "Steve Jobs",
    handle: "@stevejobs",
    tag: "Stanford 2005",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500",
    layout: "split-portrait"
  }
};

const res = await fetch("${currentOrigin}/api/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const buffer = await res.arrayBuffer();
fs.writeFileSync("quote.png", Buffer.from(buffer));`}
                  discord={`import discord
from discord.ext import commands
import aiohttp
import io

@bot.command()
async def quote(ctx, member: discord.Member, *, quote_text: str):
    payload = {
        "type": "quote",
        "data": {
            "quote": quote_text,
            "author": member.display_name,
            "handle": f"@{member.name}",
            "tag": f"#{ctx.channel.name}",
            "avatar": member.display_avatar.url,
            "layout": "modern-card"  # split-portrait | centered-minimal | modern-card | neon-cyber
        }
    }

    async with aiohttp.ClientSession() as session:
        async with session.post("${currentOrigin}/api/generate", json=payload) as resp:
            if resp.status == 200:
                data = await resp.read()
                file = discord.File(io.BytesIO(data), filename="quote.png")
                await ctx.send(file=file)
            else:
                await ctx.send("Failed to render quote.")`}
                  onCopy={(key, text) => copyToClipboard(text, key)}
                  copiedKey={copiedKey}
                  blockKey="quote"
                />
              </div>
            )}

            {/* SECTION: ANIMATION */}
            {activeSection === "animation" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Film className="h-5 w-5 text-fuchsia-400" />
                      Animation & Single Frame API
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tạo ảnh động GIF/WebP hoặc trích xuất frame tĩnh PNG siêu tốc cho bot Discord
                    </p>
                  </div>
                  <span className="rounded bg-fuchsia-500/20 px-2 py-1 font-mono text-xs text-fuchsia-300">
                    type: "animated"
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-fuchsia-500/30 bg-fuchsia-950/20 p-3 space-y-1.5">
                    <strong className="text-fuchsia-300">1. Trích xuất frame tĩnh (Single Frame PNG)</strong>
                    <p className="text-slate-400 text-[11px]">
                      Truy vấn GET trực tiếp không cần body:
                    </p>
                    <code className="block bg-black/60 p-2 rounded text-[11px] font-mono text-fuchsia-200">
                      GET /api/animation/frame?preset=welcome&time=350&userName=Alex
                    </code>
                  </div>

                  <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 space-y-1.5">
                    <strong className="text-indigo-300">2. Xuất Animation GIF / WebP</strong>
                    <p className="text-slate-400 text-[11px]">
                      Hỗ trợ payload siêu gọn <strong>⚡ Compact Keyframes</strong> (giảm 98% dung lượng JSON):
                    </p>
                    <code className="block bg-black/60 p-2 rounded text-[11px] font-mono text-indigo-200">
                      POST /api/generate (format: "gif" | "webp")
                    </code>
                  </div>
                </div>

                <CodeBlock
                  lang={codeLang}
                  curl={`# Trích xuất 1 frame PNG tĩnh theo thời gian ms
curl "${currentOrigin}/api/animation/frame?preset=welcome&time=350&userName=Daniel&guildName=Legends" \\
  --output welcome-frame.png`}
                  python={`import requests

# Direct GET single frame with template variables
url = "${currentOrigin}/api/animation/frame"
params = {
    "preset": "welcome",
    "time": 350,
    "userName": "Alex",
    "guildName": "Celestial Realm"
}

res = requests.get(url, params=params)
if res.status_code == 200:
    with open("welcome-frame.png", "wb") as f:
        f.write(res.content)
    print("Exported animation frame!")`}
                  nodejs={`import fs from "fs";

const url = new URL("${currentOrigin}/api/animation/frame");
url.searchParams.set("preset", "welcome");
url.searchParams.set("time", "350");
url.searchParams.set("userName", "Alex");

const res = await fetch(url.toString());
const buffer = await res.arrayBuffer();
fs.writeFileSync("frame.png", Buffer.from(buffer));`}
                  discord={`import discord
from discord.ext import commands
import aiohttp
import io

@bot.event
async def on_member_join(member):
    channel = member.guild.system_channel
    if not channel:
        return

    # Render dynamic welcome frame banner
    url = "${currentOrigin}/api/animation/frame"
    params = {
        "preset": "welcome",
        "time": 400,
        "userName": member.name,
        "guildName": member.guild.name,
        "userAVTurl": member.display_avatar.url
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as resp:
            if resp.status == 200:
                data = await resp.read()
                file = discord.File(io.BytesIO(data), filename="welcome.png")
                await channel.send(f"Welcome {member.mention}!", file=file)`}
                  onCopy={(key, text) => copyToClipboard(text, key)}
                  copiedKey={copiedKey}
                  blockKey="animation"
                />
              </div>
            )}

            {/* SECTION: STATS */}
            {activeSection === "stats" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Terminal className="h-5 w-5 text-emerald-400" />
                      Stats Counter Endpoint: <code>GET /api/stats</code>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Lấy tổng số ảnh và banner đã được sinh ra trên toàn bộ server
                    </p>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-2 py-1 font-mono text-xs text-emerald-300">
                    GET /api/stats
                  </span>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
                  <span className="text-xs font-semibold text-white">JSON Response:</span>
                  <pre className="p-3 bg-black/60 rounded-lg font-mono text-xs text-emerald-300 border border-white/10">
{`{
  "totalGenerated": 1428,
  "lastGeneratedAt": "2026-10-03T14:20:00.000Z"
}`}
                  </pre>
                </div>

                <CodeBlock
                  lang={codeLang}
                  curl={`curl ${currentOrigin}/api/stats`}
                  python={`import requests

res = requests.get("${currentOrigin}/api/stats")
data = res.json()
print(f"Total images generated: {data['totalGenerated']}")`}
                  nodejs={`const res = await fetch("${currentOrigin}/api/stats");
const data = await res.json();
console.log("Total generated:", data.totalGenerated);`}
                  discord={`import aiohttp

async def get_stats():
    async with aiohttp.ClientSession() as session:
        async with session.get("${currentOrigin}/api/stats") as resp:
            return await resp.json()`}
                  onCopy={(key, text) => copyToClipboard(text, key)}
                  copiedKey={copiedKey}
                  blockKey="stats"
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 bg-[#0c0918] px-6 py-3.5 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span>Server Base URL: <code className="text-purple-300 font-mono">{currentOrigin}</code></span>
            <span>·</span>
            <span>Tất cả card đều hỗ trợ tiếng Việt có dấu hoàn chỉnh</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-1.5 font-semibold text-white transition-colors"
          >
            Đóng / Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface CodeBlockProps {
  lang: CodeLang;
  curl: string;
  python: string;
  nodejs: string;
  discord: string;
  onCopy: (key: string, text: string) => void;
  copiedKey: string | null;
  blockKey: string;
}

function CodeBlock({
  lang,
  curl,
  python,
  nodejs,
  discord,
  onCopy,
  copiedKey,
  blockKey,
}: CodeBlockProps) {
  let content = curl;
  let syntax = "bash";

  if (lang === "python") {
    content = python;
    syntax = "python";
  } else if (lang === "nodejs") {
    content = nodejs;
    syntax = "javascript";
  } else if (lang === "discord") {
    content = discord;
    syntax = "python (discord.py)";
  }

  const isCopied = copiedKey === `${blockKey}-${lang}`;

  return (
    <div className="relative rounded-xl border border-white/10 bg-black/60 overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2 text-xs">
        <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wide">
          {syntax}
        </span>
        <button
          onClick={() => onCopy(`${blockKey}-${lang}`, content)}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-2.5 py-1 text-[11px] font-semibold text-white transition-colors"
        >
          {isCopied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs text-slate-200 leading-relaxed">
        {content}
      </pre>
    </div>
  );
}
