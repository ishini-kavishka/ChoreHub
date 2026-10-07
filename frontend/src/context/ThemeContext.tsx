/**
 * ThemeContext – manages app-wide LIGHT / DARK theme and brightness customization.
 * Persisted locally via AsyncStorage for instant flicker-free startup,
 * and synchronized with the backend user_preferences database.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsService } from '@/services/settingsService';
import { getUser, subscribeSession } from '@/services/authStorage';

export type AppTheme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  inputBackground: string;
  navigationBackground: string;
  isDark: boolean;
  error: string;
  success: string;
}

export interface ThemeContextValue {
  ready: boolean;
  /** Resolved theme – always 'light' or 'dark' */
  theme: 'light' | 'dark';
  /** User preference (may be 'system', 'light', 'dark') */
  preference: AppTheme;
  /** Brightness percentage (30 - 100) */
  brightness: number;
  /** Whether auto-brightness is enabled */
  autoBrightness: boolean;
  /** Semantic theme colors calculated dynamically from theme & brightness */
  colors: ThemeColors;
  setTheme: (t: AppTheme, syncRemote?: boolean) => Promise<void>;
  setBrightness: (b: number) => Promise<void>;
  setAutoBrightness: (a: boolean) => Promise<void>;
}

const THEME_KEY = 'chorehub.theme';
const BRIGHTNESS_KEY = 'chorehub.brightness';
const AUTO_BRIGHTNESS_KEY = 'chorehub.auto_brightness';

function interpolateRgb(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): string {
  const f = Math.max(0, Math.min(1, factor));
  const r = Math.round(color1[0] + f * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + f * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + f * (color2[2] - color1[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

function calculateColors(theme: 'light' | 'dark', brightness: number): ThemeColors {
  const factor = (brightness - 30) / 70; // 0.0 at 30%, 1.0 at 100%
  const isDark = theme === 'dark';

  if (isDark) {
    // Dark theme: 30% = deep night mode, 100% = crisp vivid dark mode
    const bg = interpolateRgb([9, 8, 15], [26, 23, 40], factor);
    const card = interpolateRgb([17, 15, 27], [38, 33, 56], factor);
    const surface = interpolateRgb([24, 21, 38], [48, 42, 70], factor);
    const textPrimary = interpolateRgb([215, 212, 228], [255, 255, 255], factor);
    const textSecondary = interpolateRgb([138, 134, 156], [195, 190, 215], factor);
    const border = interpolateRgb([32, 28, 48], [58, 50, 86], factor);

    return {
      background: bg,
      card,
      surface,
      textPrimary,
      textSecondary,
      border,
      primary: '#7C5CFC',
      inputBackground: card,
      navigationBackground: card,
      isDark: true,
      error: '#FFAAA8',
      success: '#76DEBB',
    };
  }

  // Light theme: 30% = softer paper tone, 100% = crisp clean white
  const bg = interpolateRgb([220, 218, 228], [250, 249, 253], factor);
  const card = interpolateRgb([234, 232, 242], [255, 255, 255], factor);
  const surface = interpolateRgb([212, 209, 224], [244, 242, 250], factor);
  const textPrimary = interpolateRgb([22, 19, 32], [30, 27, 46], factor);
  const textSecondary = interpolateRgb([95, 92, 110], [117, 114, 136], factor);
  const border = interpolateRgb([202, 199, 218], [234, 231, 245], factor);

  return {
    background: bg,
    card,
    surface,
    textPrimary,
    textSecondary,
    border,
    primary: '#7C5CFC',
    inputBackground: card,
    navigationBackground: card,
    isDark: false,
    error: '#B3261E',
    success: '#15803D',
  };
}

const ThemeContext = createContext<ThemeContextValue>({
  ready: false,
  theme: 'light',
  preference: 'system',
  brightness: 70,
  autoBrightness: false,
  colors: calculateColors('light', 70),
  setTheme: async () => {},
  setBrightness: async () => {},
  setAutoBrightness: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreference] = useState<AppTheme>('system');
  const [brightness, setBrightnessState] = useState<number>(70);
  const [autoBrightness, setAutoBrightnessState] = useState<boolean>(false);

  const [ready,setReady]=useState(false);
  const version=useRef(0), account=useRef('guest');
  const saveQueue=useRef<Promise<unknown>>(Promise.resolve());
  const keys=(id:string)=>[THEME_KEY,BRIGHTNESS_KEY,AUTO_BRIGHTNESS_KEY].map(key=>key+'.'+id);
  const validTheme=(value:unknown):value is AppTheme=>['light','dark','system'].includes(value as string);
  useEffect(()=>{
    let active=true;
    const restore=async()=>{
      const request=++version.current;
      const user=await getUser();
      if(!active||request!==version.current)return;
      const id=user?.id || 'guest';account.current=id;
      const values=await Promise.all(keys(id).map(key=>AsyncStorage.getItem(key)));
      if(id==='guest'&&!values[0]){
        const legacy=await Promise.all([THEME_KEY,BRIGHTNESS_KEY,AUTO_BRIGHTNESS_KEY].map(key=>AsyncStorage.getItem(key)));
        values.splice(0,3,...legacy);
      }
      if(!active||request!==version.current)return;
      const local={theme:validTheme(values[0])?values[0]:'system' as AppTheme,brightness:Math.max(30,Math.min(100,Number(values[1]) || 70)),auto_brightness:values[2]==='true'};
      setPreference(local.theme);setBrightnessState(local.brightness);setAutoBrightnessState(local.auto_brightness);
      if(values[0])setReady(true);
      if(user){
        try{
          const pending=await AsyncStorage.getItem(THEME_KEY+'.pending.'+id)==='true';
          const remote=await settingsService.getPreferences(true);
          if(!active||request!==version.current)return;
          if(pending){
            await settingsService.savePreferences(local);
            if(active&&request===version.current)await AsyncStorage.setItem(THEME_KEY+'.pending.'+id,'false');
          }else{
          if(validTheme(remote.theme))setPreference(remote.theme);
          if(Number.isFinite(remote.brightness))setBrightnessState(Math.max(30,Math.min(100,remote.brightness!)));
          if(typeof remote.auto_brightness==='boolean')setAutoBrightnessState(remote.auto_brightness);
          await Promise.all(keys(id).map((key,index)=>AsyncStorage.setItem(key,String([remote.theme,remote.brightness ?? local.brightness,remote.auto_brightness ?? local.auto_brightness][index]))));
          }
        }catch{/* Restore this account's cache when offline, without demo preferences. */}
      }
      if(active&&request===version.current)setReady(true);
    };
    const run=()=>{const request=version.current+1;void restore().catch(()=>{if(active&&request===version.current)setReady(true);});};run();
    const unsubscribe=subscribeSession(run);
    const foreground=AppState.addEventListener('change',state=>{if(state==='active')run();});
    return()=>{active=false;version.current++;unsubscribe();foreground.remove();};
  },[]);

  const resolvedTheme: 'light' | 'dark' =
    preference === 'system' ? systemScheme : preference;

  // If auto-brightness is enabled, adapt brightness to theme/environment
  const activeBrightness = autoBrightness
    ? resolvedTheme === 'dark'
      ? 60
      : 85
    : brightness;

  const colors = useMemo(
    () => calculateColors(resolvedTheme, activeBrightness),
    [resolvedTheme, activeBrightness]
  );

  const persist=useCallback(async(field:'theme'|'brightness'|'auto_brightness',value:AppTheme|number|boolean,syncRemote=true)=>{
    version.current++;const id=account.current;
    const index=field==='theme'?0:field==='brightness'?1:2;
    await AsyncStorage.setItem(keys(id)[index],String(value));
    if(syncRemote && id!=='guest'){
      await AsyncStorage.setItem(THEME_KEY+'.pending.'+id,'true');
      const request=version.current;
      const save=async()=>{
        if((await getUser())?.id!==id)return;
        try{await settingsService.savePreferences({[field]:value});if(request===version.current)await AsyncStorage.setItem(THEME_KEY+'.pending.'+id,'false');}
        catch{console.warn('Could not sync theme preference; the local preference was retained for retry.');}
      };
      saveQueue.current=saveQueue.current.then(save,save);await saveQueue.current;
    }
  },[]);
  const setTheme=useCallback(async(value:AppTheme,syncRemote=true)=>{
    if(!['light','dark','system'].includes(value))return;
    setPreference(value);await persist('theme',value,syncRemote);
  },[persist]);
  const setBrightness=useCallback(async(value:number)=>{
    if(!Number.isFinite(value))return;
    const clamped=Math.max(30,Math.min(100,Math.round(value)));setBrightnessState(clamped);await persist('brightness',clamped);
  },[persist]);
  const setAutoBrightness=useCallback(async(value:boolean)=>{setAutoBrightnessState(value);await persist('auto_brightness',value);},[persist]);

  return (
    <ThemeContext.Provider
      value={{
        ready,
        theme: resolvedTheme,
        preference,
        brightness: activeBrightness,
        autoBrightness,
        colors,
        setTheme,
        setBrightness,
        setAutoBrightness,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}

/** Shared memoization for existing client styles; all colors come from one provider. */
export function useThemedStyles<T>(factory:(colors:ThemeColors)=>T):T {
  const {colors}=useAppTheme();
  return useMemo(()=>factory(colors),[factory,colors]);
}
