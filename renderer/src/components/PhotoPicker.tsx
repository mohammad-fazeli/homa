import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import Avatar from "./ui/Avatar";
import { PHOTO_MAX_BYTES } from "@shared/photos";
import { toast } from "react-toastify";

export default function PhotoPicker({
  firstName,
  lastName,
  photoUrl,
  previewUrl,
  size = "xl",
  compact = false,
  onPick,
  onRemove,
}: {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  previewUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  compact?: boolean;
  onPick: (bytes: Uint8Array) => void;
  onRemove?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = previewUrl || photoUrl;
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [shown]);

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          title="انتخاب عکس"
        >
          <Avatar
            firstName={firstName}
            lastName={lastName}
            photoUrl={broken ? null : shown}
            size={size}
          />
          <span className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow">
            <Camera size={14} />
          </span>
        </button>
        {compact && onRemove && shown && (
          <button
            type="button"
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-surface border border-line text-danger flex items-center justify-center"
            title="حذف عکس"
            onClick={onRemove}
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
      {!compact && (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            className="text-sm text-brand"
            onClick={() => inputRef.current?.click()}
          >
            انتخاب عکس
          </button>
          {onRemove && shown && (
            <button
              type="button"
              className="text-sm text-danger inline-flex items-center gap-1"
              onClick={onRemove}
            >
              <Trash2 size={12} /> حذف عکس
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > PHOTO_MAX_BYTES) {
            toast.error("حجم عکس بیش از ۸ مگابایت است");
            return;
          }
          onPick(new Uint8Array(await file.arrayBuffer()));
        }}
      />
    </div>
  );
}
