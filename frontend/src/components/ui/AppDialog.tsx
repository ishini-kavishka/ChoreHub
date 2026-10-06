import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, type AlertButton, type AlertOptions } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateFeedback } from '@/i18n/translations';

type DialogMessage = string | { key: string; values: Record<string, string | number | { translationKey: string }> };
type ShowDialog = (title: string, message?: DialogMessage, buttons?: AlertButton[], options?: AlertOptions) => void;
interface Dialog { id: number; title: string; message?: DialogMessage; buttons?: AlertButton[]; options?: AlertOptions; }
const DialogContext = createContext<ShowDialog>(() => {});

// Existing client alert actions use the same callbacks and labels, but their
// presentation follows the selected app theme rather than the device's theme.
export function AppDialogProvider({ children }: { children: React.ReactNode }) {
  const { colors: c } = useAppTheme(), { t } = useLanguage();
  const [queue, setQueue] = useState<Dialog[]>([]);
  const sequence = useRef(0), handled = useRef(0);
  const alert = useCallback<ShowDialog>((title, message, buttons, options) => { const id = ++sequence.current; setQueue(old => [...old, { id, title, message, buttons, options }]); }, []);
  const current = queue[0];
  const messageData = current?.message;
  const message = typeof messageData === 'string'
    ? translateFeedback(messageData, t)
    : messageData
      ? t(messageData.key).replace(/\{(\w+)\}/g, (placeholder, name) => {
          const value = messageData.values[name];
          return typeof value === 'object' ? t(value.translationKey) : String(value ?? placeholder);
        })
      : '';
  const dismiss = () => {
    if (!current || current.id <= handled.current || current.options?.cancelable === false) return;
    handled.current = current.id;
    setQueue(old => old.slice(1)); current?.options?.onDismiss?.();
  };
  const buttons = current?.buttons?.length ? current.buttons : [{ text: t('ui_ok') }];
  return <DialogContext.Provider value={alert}>{children}
    <Modal visible={!!current} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,.4)' }}>
        <View accessibilityViewIsModal style={{ maxWidth: 440, width: '100%', alignSelf: 'center', padding: 24, gap: 16, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }}>
          <Text style={{ color: c.textPrimary, fontSize: 20, fontWeight: '700' }}>{translateFeedback(current?.title || '', t)}</Text>
          {!!message && <ScrollView style={{ maxHeight: 240 }}><Text style={{ color: c.textSecondary, lineHeight: 22 }}>{message}</Text></ScrollView>}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 12 }}>
            {buttons.map((button, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={translateFeedback(button.text || '', t)} onPress={() => { if (!current || current.id <= handled.current) return; handled.current = current.id; setQueue(old => old.slice(1)); button.onPress?.(); }} style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, backgroundColor: c.surface }}>
              <Text style={{ color: button.style === 'destructive' ? c.error : c.primary, fontWeight: '700' }}>{translateFeedback(button.text || '', t)}</Text>
            </Pressable>)}
          </View>
        </View>
      </View>
    </Modal>
  </DialogContext.Provider>;
}
export function useAppAlert() { return useContext(DialogContext); }
