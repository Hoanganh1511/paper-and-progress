"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteAvatar,
  getProfile,
  updateProfile,
  uploadAvatar,
  type ProfilePatch,
  type UserProfile,
} from "./profileApi";

export type ProfileLoadState = "loading" | "ready" | "error";

export interface UseProfileResult {
  profile: UserProfile | null;
  state: ProfileLoadState;
  reload: () => void;
  /** Saves the fields and updates `profile`. Throws `ProfileApiError` on failure. */
  save: (patch: ProfilePatch) => Promise<void>;
  /** Uploads a new picture. Throws `ProfileApiError` on failure. */
  changeAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
}

/** The signed-in user's profile, loaded once and kept in step with every change. */
export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [state, setState] = useState<ProfileLoadState>("loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    getProfile()
      .then((loaded) => {
        if (!isCurrent) return;
        setProfile(loaded);
        setState("ready");
      })
      .catch(() => {
        if (isCurrent) setState("error");
      });
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setState("loading");
    setReloadKey((key) => key + 1);
  }, []);

  const save = useCallback(async (patch: ProfilePatch) => {
    setProfile(await updateProfile(patch));
  }, []);

  const changeAvatar = useCallback(async (file: File) => {
    const avatarUrl = await uploadAvatar(file);
    setProfile((current) => current && { ...current, avatarUrl });
  }, []);

  const removeAvatar = useCallback(async () => {
    await deleteAvatar();
    setProfile((current) => current && { ...current, avatarUrl: null });
  }, []);

  return { profile, state, reload, save, changeAvatar, removeAvatar };
}
