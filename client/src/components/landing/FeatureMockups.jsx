import { useEffect, useRef, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Lock,
  Palette,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { classNames } from "./landingUtils.jsx";

function EasyUploadMockup() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("uploading");
  const [inView, setInView] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    setIsFocused(document.hasFocus());

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!inView || !isFocused || status !== "uploading") return;

    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 1));
    }, 30);

    return () => clearInterval(timer);
  }, [inView, isFocused, status]);

  useEffect(() => {
    if (progress >= 100 && status === "uploading") {
      setStatus("complete");
    }
  }, [progress, status]);

  useEffect(() => {
    if (status !== "complete" || !inView || !isFocused) return;

    const timeout = setTimeout(() => {
      setProgress(0);
      setStatus("uploading");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [status, inView, isFocused]);

  return (
    <div
      ref={containerRef}
      className="flex w-full max-w-[210px] flex-col items-center rounded-2xl border border-dashed border-[#FFB7AC] bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.02)]"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#FFB7AC]/15 text-[#C62828]">
        <Upload className="h-5 w-5" />
      </div>
      <div className="mb-1 flex w-full items-center justify-between text-[11px] text-neutral-500">
        <span>{progress === 100 ? "complete" : "uploading..."}</span>
        <span className="font-semibold text-[#C62828]">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-[#C62828]"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function ShareSecurelyMockup() {
  const [emailInput, setEmailInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [shares, setShares] = useState([
    { email: "emma@company.com", status: "Delivered" },
  ]);

  useEffect(() => {
    const targetEmail = "alex@company.com";
    let index = 0;
    let typeTimer;
    let cycleTimer;

    const startTyping = () => {
      setEmailInput("");
      index = 0;
      typeTimer = setInterval(() => {
        setEmailInput((prev) => targetEmail.slice(0, prev.length + 1));
        index += 1;
        if (index === targetEmail.length) {
          clearInterval(typeTimer);
          setTimeout(() => {
            setIsSending(true);
            setTimeout(() => {
              setIsSending(false);
              setShares((prev) => [
                ...prev,
                { email: targetEmail, status: "Sent" },
              ]);

              cycleTimer = setTimeout(() => {
                setShares([{ email: "emma@company.com", status: "Delivered" }]);
                startTyping();
              }, 4000);
            }, 1000);
          }, 800);
        }
      }, 80);
    };

    startTyping();

    return () => {
      clearInterval(typeTimer);
      clearTimeout(cycleTimer);
    };
  }, []);

  return (
    <div className="w-full max-w-[240px] rounded-xl border border-neutral-100 bg-white p-3.5 text-left shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <div className="mb-2.5 flex items-center justify-between border-b border-neutral-50 pb-2 text-[11px] font-bold text-neutral-800">
        <span>Share "Project Plan.pdf"</span>
        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[8px] font-bold text-[#C62828]">
          Direct Email
        </span>
      </div>

      <div className="mb-2.5 flex items-center gap-1 rounded-lg border border-neutral-100 bg-neutral-50 p-1 text-[9px]">
        <input
          type="text"
          readOnly
          value={emailInput}
          placeholder="Enter recipient email..."
          className="flex-1 border-none bg-transparent px-1 text-[8.5px] text-neutral-700 outline-none"
        />
        <button
          className={classNames(
            "rounded px-2 py-0.5 text-[8.5px] font-bold text-white transition-all",
            isSending
              ? "cursor-wait bg-[#C62828]/50"
              : "bg-[#C62828] hover:bg-[#B71C1C]",
          )}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>

      <div className="mb-1.5 text-[8px] font-bold uppercase tracking-wider text-neutral-400">
        Shared Access
      </div>
      <div className="space-y-1.5">
        {shares.map((share, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FFB7AC]/20 text-[8px] font-bold uppercase text-[#C62828]">
                {share.email.charAt(0)}
              </div>
              <span className="max-w-[125px] truncate text-[9.5px] font-medium text-neutral-600">
                {share.email}
              </span>
            </div>
            <div
              className={classNames(
                "shrink-0 rounded border px-1.5 py-0.5 text-[8px] font-semibold",
                share.status === "Delivered"
                  ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                  : "border-blue-100 bg-blue-50 text-blue-600",
              )}
            >
              {share.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyFirstMockup() {
  return (
    <div className="relative flex h-[110px] w-full items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(39,201,63,0.12),transparent_65%)]" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl border border-[#27C93F]/20 bg-white text-[#27C93F] shadow-[0_10px_30px_rgba(39,201,63,0.15)]">
        <ShieldCheck className="h-8 w-8" />
        <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#27C93F] text-white shadow-md">
          <Lock className="h-2.5 w-2.5" />
        </div>
      </div>
    </div>
  );
}

function AccessAnywhereMockup() {
  return (
    <div className="relative mx-auto h-[120px] w-full max-w-[220px] overflow-hidden">
      <div className="absolute bottom-0 left-0 flex h-[90px] w-[150px] flex-col rounded-lg border border-neutral-100 bg-white p-1.5 shadow-md">
        <div className="mb-1.5 flex items-center gap-1 border-b border-neutral-50 pb-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#FF5F56]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#27C93F]" />
        </div>
        <div className="grid flex-1 grid-cols-3 gap-1.5">
          <div className="flex flex-col items-center justify-center rounded border border-neutral-100 bg-neutral-50 p-1">
            <FileText className="mb-1 h-3.5 w-3.5 text-red-500" />
            <span className="text-[6px] text-neutral-500 scale-90">
              plan.pdf
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded border border-neutral-100 bg-neutral-50 p-1">
            <FileSpreadsheet className="mb-1 h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[6px] text-neutral-500 scale-90">
              sales.xlsx
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded border border-neutral-100 bg-neutral-50 p-1">
            <Palette className="mb-1 h-3.5 w-3.5 text-purple-500" />
            <span className="text-[6px] text-neutral-500 scale-90">
              logo.png
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 right-1 flex h-[105px] w-[60px] flex-col rounded-xl border border-neutral-800 bg-[#0B0C0E] p-1 shadow-lg">
        <div className="mx-auto mb-1.5 h-1 w-5 rounded-full bg-neutral-700" />
        <div className="flex-1 space-y-1.5 rounded-md bg-white p-1">
          <div className="flex h-4 w-full items-center gap-1 rounded border border-neutral-100 bg-neutral-50 px-1 text-[5px] text-neutral-600 scale-90 origin-left">
            <FileText className="h-2.5 w-2.5 shrink-0 text-red-500" />
            <span>plan.pdf</span>
          </div>
          <div className="flex h-4 w-full items-center gap-1 rounded border border-neutral-100 bg-neutral-50 px-1 text-[5px] text-neutral-600 scale-90 origin-left">
            <FileSpreadsheet className="h-2.5 w-2.5 shrink-0 text-emerald-500" />
            <span>sales.xlsx</span>
          </div>
          <div className="flex h-4 w-full items-center gap-1 rounded border border-neutral-100 bg-neutral-50 px-1 text-[5px] text-neutral-600 scale-90 origin-left">
            <Palette className="h-2.5 w-2.5 shrink-0 text-purple-500" />
            <span>logo.png</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SemanticSearchMockup() {
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    const text = "Q2 budget presentation";
    let index = 0;
    let timer;

    const type = () => {
      setTypedText(text.slice(0, index + 1));
      index += 1;
      if (index === text.length) {
        clearInterval(timer);
        setTimeout(() => {
          index = 0;
          timer = setInterval(type, 110);
        }, 5000);
      }
    };

    timer = setInterval(type, 110);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full max-w-[260px] rounded-xl border border-neutral-100 bg-white p-3 text-left shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
      <div className="mb-2 flex w-full items-center gap-1.5 rounded-lg border border-neutral-100 bg-neutral-50 px-2.5 py-1.5 font-mono text-[9px] text-neutral-600">
        <Search className="h-3 w-3 text-neutral-400" />
        <span>{typedText}</span>
        <span className="ml-0.5 inline-block h-3 w-1 bg-[#C62828]" />
      </div>
      <div className="space-y-1.5">
        <div className="relative overflow-hidden rounded border border-neutral-50 bg-neutral-50/50 p-1.5 text-[9px]">
          <div className="absolute top-0 right-0 rounded-bl bg-emerald-50 px-1 py-0.5 text-[7px] font-bold text-emerald-600 scale-90 origin-top-right">
            98% match
          </div>
          <div className="mb-0.5 flex items-center gap-1.5 font-bold text-neutral-800">
            <FileText className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span>Quarterly Financial Overview</span>
          </div>
          <div className="font-mono text-[7.5px] text-neutral-400 scale-95 origin-left">
            &quot;...our{" "}
            <mark className="rounded bg-[#C62828]/10 px-0.5 text-[#C62828]">
              Q2 budget
            </mark>{" "}
            highlights and key insights...&quot;
          </div>
        </div>

        <div className="rounded border border-neutral-50 bg-neutral-50/50 p-1.5 text-[9px]">
          <div className="mb-0.5 flex items-center gap-1.5 font-bold text-neutral-800">
            <FileText className="h-3.5 w-3.5 shrink-0 text-blue-500" />
            <span>Budget Meeting Notes</span>
          </div>
          <div className="font-mono text-[7.5px] text-neutral-400 scale-95 origin-left">
            &quot;...discussed the{" "}
            <mark className="rounded bg-[#C62828]/10 px-0.5 text-[#C62828]">
              Q2 budget
            </mark>
            , forecasts and allocation...&quot;
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartTrashMockup() {
  return (
    <div className="relative flex h-[110px] w-full items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(198,40,40,0.06),transparent_65%)]" />
      <div className="absolute -top-3 left-[22%] flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-bounce">
        <FileText className="h-4.5 w-4.5 text-red-500" />
      </div>
      <div className="absolute -top-5 right-[22%] flex h-9 w-9 items-center justify-center rounded-xl border border-neutral-100 bg-white shadow-[0_4px_12px_rgba(0,0,0,0.05)] animate-bounce [animation-delay:0.5s]">
        <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500" />
      </div>
      <div className="relative mt-4 flex h-15 w-15 items-center justify-center rounded-full border border-red-100 bg-red-50 text-[#C62828] shadow-inner">
        <Trash2 className="h-6.5 w-6.5" />
      </div>
    </div>
  );
}

export {
  EasyUploadMockup,
  ShareSecurelyMockup,
  PrivacyFirstMockup,
  AccessAnywhereMockup,
  SemanticSearchMockup,
  SmartTrashMockup,
};
