import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type TodoTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

type Filter = 'all' | 'open' | 'done';

const STORAGE_KEY = 'todo-list.tasks.v1';
const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Done', value: 'done' },
];

function isTodoTask(value: unknown): value is TodoTask {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'number'
  );
}

function triggerLightHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function TodoListScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [draft, setDraft] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function restoreTasks() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (isActive && stored) {
          const parsed: unknown = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setTasks(parsed.filter(isTodoTask));
          }
        }
      } catch {
        if (isActive) {
          setStorageError('Your saved list could not be loaded.');
        }
      } finally {
        if (isActive) {
          setHasLoaded(true);
        }
      }
    }

    void restoreTasks();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    let isActive = true;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
      .then(() => {
        if (isActive) {
          setStorageError(null);
        }
      })
      .catch(() => {
        if (isActive) {
          setStorageError('Your changes could not be saved. Check device storage.');
        }
      });

    return () => {
      isActive = false;
    };
  }, [hasLoaded, tasks]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (first, second) =>
          Number(first.completed) - Number(second.completed) ||
          first.createdAt - second.createdAt,
      ),
    [tasks],
  );
  const visibleTasks = useMemo(
    () =>
      sortedTasks.filter((task) => {
        if (filter === 'open') {
          return !task.completed;
        }
        if (filter === 'done') {
          return task.completed;
        }
        return true;
      }),
    [filter, sortedTasks],
  );
  const completedCount = tasks.filter((task) => task.completed).length;
  const remainingCount = tasks.length - completedCount;
  const progress = tasks.length === 0 ? 0 : completedCount / tasks.length;
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
    .format(new Date())
    .toUpperCase();

  function addTask() {
    const title = draft.trim();
    if (!title) {
      return;
    }

    triggerLightHaptic();
    setTasks((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        title,
        completed: false,
        createdAt: Date.now(),
      },
    ]);
    setDraft('');
    Keyboard.dismiss();
  }

  function toggleTask(id: string) {
    triggerLightHaptic();
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(id: string) {
    triggerLightHaptic();
    setTasks((current) => current.filter((task) => task.id !== id));
  }

  const header = (
    <View style={styles.listHeader}>
      <View style={styles.dateRow}>
        <View style={styles.dateMarker} />
        <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
          {dateLabel}
        </Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>
        Make today{'\n'}count.
      </Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        A little progress goes a long way.
      </Text>

      <View
        style={[
          styles.progressCard,
          { backgroundColor: colors.primary, borderRadius: colors.radius },
        ]}
      >
        <View style={styles.progressTopRow}>
          <View>
            <Text style={styles.progressEyebrow}>YOUR PROGRESS</Text>
            <Text style={styles.progressHeadline}>
              {tasks.length === 0
                ? 'A fresh start'
                : remainingCount === 0
                  ? 'You did it.'
                  : `${remainingCount} ${remainingCount === 1 ? 'task' : 'tasks'} to go`}
            </Text>
          </View>
          <View style={styles.progressCount}>
            <Text style={styles.progressCountText}>
              {completedCount}/{tasks.length}
            </Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(progress * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressCaption}>
          {tasks.length === 0
            ? 'Add one small thing to get started.'
            : `${completedCount} ${completedCount === 1 ? 'task' : 'tasks'} completed`}
        </Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => {
          const selected = item.value === filter;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setFilter(item.value)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selected ? colors.foreground : colors.card,
                  borderColor: selected ? colors.foreground : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selected ? colors.card : colors.mutedForeground },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeading}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          YOUR TASKS
        </Text>
        <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>
          {visibleTasks.length}
        </Text>
      </View>

      {storageError ? (
        <View
          style={[
            styles.storageNotice,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="alert-circle" size={16} color={colors.destructive} />
          <Text style={[styles.storageNoticeText, { color: colors.destructive }]}>
            {storageError}
          </Text>
        </View>
      ) : null}

      {!hasLoaded ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : visibleTasks.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.secondary },
            ]}
          >
            <Feather
              name={filter === 'done' ? 'check' : 'sun'}
              size={20}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {filter === 'done'
              ? 'Nothing checked off yet.'
              : filter === 'open'
                ? 'All caught up.'
                : 'Your list is clear.'}
          </Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
            {filter === 'all'
              ? 'Add your first task below and keep your day moving.'
              : filter === 'open'
                ? 'Enjoy the breathing room.'
                : 'Finished tasks will show up here.'}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <StatusBar
        barStyle={colors.background === '#17231B' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <FlatList
        data={hasLoaded ? visibleTasks : []}
        keyExtractor={(task) => task.id}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingTop:
              Platform.OS === 'web'
                ? Math.max(insets.top, 67) + 18
                : insets.top + 20,
            paddingBottom: 20,
          },
        ]}
        ListHeaderComponent={header}
        renderItem={({ item }) => (
          <View
            style={[
              styles.taskRow,
              { borderBottomColor: colors.border },
            ]}
          >
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.completed }}
              accessibilityLabel={
                item.completed
                  ? `Mark ${item.title} as open`
                  : `Mark ${item.title} as done`
              }
              onPress={() => toggleTask(item.id)}
              style={[
                styles.checkbox,
                {
                  backgroundColor: item.completed
                    ? colors.primary
                    : 'transparent',
                  borderColor: item.completed
                    ? colors.primary
                    : colors.border,
                },
              ]}
            >
              {item.completed ? (
                <Feather name="check" size={14} color={colors.primaryForeground} />
              ) : null}
            </Pressable>
            <Text
              numberOfLines={3}
              style={[
                styles.taskTitle,
                {
                  color: item.completed
                    ? colors.mutedForeground
                    : colors.foreground,
                  textDecorationLine: item.completed ? 'line-through' : 'none',
                },
              ]}
            >
              {item.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delete ${item.title}`}
              hitSlop={10}
              onPress={() => deleteTask(item.id)}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={17} color={colors.mutedForeground} />
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.rowSeparator} />}
        style={styles.taskList}
      />

      <View
        style={[
          styles.composerOuter,
          {
            paddingBottom:
              Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0) + 12,
          },
        ]}
      >
        <View
          style={[
            styles.composer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather name="plus" size={20} color={colors.primary} />
          <TextInput
            accessibilityLabel="New task"
            testID="new-task-input"
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addTask}
            placeholder="Add a task..."
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="done"
            enterKeyHint="done"
            maxLength={180}
            style={[styles.input, { color: colors.foreground }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add task"
            testID="add-task-button"
            disabled={!draft.trim()}
            onPress={addTask}
            style={[
              styles.addButton,
              {
                backgroundColor: draft.trim()
                  ? colors.primary
                  : colors.secondary,
              },
            ]}
          >
            <Feather
              name="arrow-up"
              size={18}
              color={
                draft.trim()
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  listHeader: {
    paddingBottom: 10,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 18,
  },
  dateMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E6B93F',
  },
  dateLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    lineHeight: 42,
    letterSpacing: -1.1,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
  },
  progressCard: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressEyebrow: {
    color: '#D8E8DA',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  progressHeadline: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 19,
    letterSpacing: -0.3,
  },
  progressCount: {
    minWidth: 48,
    height: 42,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.13)',
  },
  progressCountText: {
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginTop: 18,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#F3C84B',
  },
  progressCaption: {
    color: '#D8E8DA',
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 9,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 24,
    marginBottom: 22,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderWidth: 1,
    borderRadius: 20,
  },
  filterText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.1,
  },
  sectionCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  storageNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  storageNoticeText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  loadingState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    marginBottom: 13,
  },
  emptyTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    textAlign: 'center',
  },
  emptyCopy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  taskList: {
    flexGrow: 0,
  },
  taskRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
  },
  rowSeparator: {
    height: 0,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    width: 32,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerOuter: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  composer: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    paddingLeft: 16,
    paddingRight: 7,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    paddingVertical: 0,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
