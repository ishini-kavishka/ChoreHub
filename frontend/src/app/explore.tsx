import { useLanguage } from '@/context/LanguageContext';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Collapsible } from '@/components/ui/collapsible';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TabTwoScreen() {
  const { t } = useLanguage();
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentInset={insets}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.titleContainer}>
          <ThemedText type="subtitle">{t('ui_explore')}</ThemedText>
          <ThemedText style={styles.centerText} themeColor="textSecondary">{t('ui_this_starter_app_includes_example')}{'\n'}{t('ui_code_to_help_you_get_started')}</ThemedText>

          <ExternalLink href="https://docs.expo.dev" asChild>
            <Pressable style={({ pressed }) => pressed && styles.pressed}>
              <ThemedView type="backgroundElement" style={styles.linkButton}>
                <ThemedText type="link">{t('ui_expo_documentation')}</ThemedText>
                <SymbolView
                  tintColor={theme.text}
                  name={{ ios: 'arrow.up.right.square', android: 'link', web: 'link' }}
                  size={12}
                />
              </ThemedView>
            </Pressable>
          </ExternalLink>
        </ThemedView>

        <ThemedView style={styles.sectionsWrapper}>
          <Collapsible title={t('ui_file_based_routing')}>
            <ThemedText type="small">{t('ui_this_app_has_two_screens')}<ThemedText type="code">src/app/index.tsx</ThemedText>{t('ui_and')}{' '}
              <ThemedText type="code">src/app/explore.tsx</ThemedText>
            </ThemedText>
            <ThemedText type="small">{t('ui_the_layout_file_in')}<ThemedText type="code">src/app/_layout.tsx</ThemedText>{t('ui_sets_up_the_tab_navigator')}</ThemedText>
            <ExternalLink href="https://docs.expo.dev/router/introduction">
              <ThemedText type="linkPrimary">{t('ui_learn_more')}</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title={t('ui_android_ios_and_web_support')}>
            <ThemedView type="backgroundElement" style={styles.collapsibleContent}>
              <ThemedText type="small">{t('ui_you_can_open_this_project_on_android_ios_and_the_web_to_open_the_web_version_press')}<ThemedText type="smallBold">w</ThemedText>{t('ui_in_the_terminal_running_this_project')}</ThemedText>
              <Image
                source={require('@/assets/images/tutorial-web.png')}
                style={styles.imageTutorial}
              />
            </ThemedView>
          </Collapsible>

          <Collapsible title={t('ui_images')}>
            <ThemedText type="small">{t('ui_for_static_images_you_can_use_the')}<ThemedText type="code">@2x</ThemedText>{t('ui_and')}{' '}
              <ThemedText type="code">@3x</ThemedText>{t('ui_suffixes_to_provide_files_for_different_screen_densities')}</ThemedText>
            <Image source={require('@/assets/images/react-logo.png')} style={styles.imageReact} />
            <ExternalLink href="https://reactnative.dev/docs/images">
              <ThemedText type="linkPrimary">{t('ui_learn_more')}</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title={t('ui_light_and_dark_mode_components')}>
            <ThemedText type="small">{t('ui_this_template_has_light_and_dark_mode_support_the')}{' '}
              <ThemedText type="code">useColorScheme()</ThemedText>{t('ui_hook_lets_you_inspect_what_the_user_apos_s_current_color_scheme_is_and_so_you_can_adjust_ui_colors_accordingly')}</ThemedText>
            <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
              <ThemedText type="linkPrimary">{t('ui_learn_more')}</ThemedText>
            </ExternalLink>
          </Collapsible>

          <Collapsible title={t('ui_animations')}>
            <ThemedText type="small">{t('ui_this_template_includes_an_example_of_an_animated_component_the')}{' '}
              <ThemedText type="code">src/components/ui/collapsible.tsx</ThemedText>{t('ui_component_uses_the_powerful')}<ThemedText type="code">react-native-reanimated</ThemedText>{t('ui_library_to_animate_opening_this_hint')}</ThemedText>
          </Collapsible>
        </ThemedView>
        {Platform.OS === 'web' && <WebBadge />}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  titleContainer: {
    gap: Spacing.three,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  linkButton: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    justifyContent: 'center',
    gap: Spacing.one,
    alignItems: 'center',
  },
  sectionsWrapper: {
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  collapsibleContent: {
    alignItems: 'center',
  },
  imageTutorial: {
    width: '100%',
    aspectRatio: 296 / 171,
    borderRadius: Spacing.three,
    marginTop: Spacing.two,
  },
  imageReact: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
});
