import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { router, useFocusEffect, useIsFocused, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';

export type SettingsPath = '/home/settings' | '/admin/settings' | '/admin/profile';

// Settings children are hidden tabs, not stack screens. A generic back() can
// leave their owning navigator, especially after a refresh or direct link.
export function useSettingsBack(path: SettingsPath, familyId?: string, enabled = true) {
  const navigation = useNavigation();
  const focused = useIsFocused();
  const goBack = useCallback(() => {
    router.navigate({ pathname: path, ...(familyId ? { params: { family_id: familyId } } : {}) });
  }, [path, familyId]);

  // Expo's prevention context propagates through nested navigators and protects
  // native stack gestures as well as browser/history actions. Plain
  // beforeRemove.preventDefault() is not fully supported by native-stack.
  usePreventRemove(enabled && focused, ({ data }) => {
    if (['GO_BACK', 'POP', 'POP_TO_TOP'].includes(data.action.type)) goBack();
    else navigation.dispatch(data.action); // Preserve intentional login/logout navigation.
  });

  useFocusEffect(useCallback(() => {
    if (!enabled) return;
    const hardware = BackHandler.addEventListener('hardwareBackPress', () => { goBack(); return true; });
    return () => hardware.remove();
  }, [goBack, enabled]));
  return goBack;
}
