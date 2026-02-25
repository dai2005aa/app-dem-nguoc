import React, { use, useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  StyleSheet,
  Text,
  TextInput,
  View,
  AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const InitialTime = 100;
export default function App() {
  const intervalId = useRef<number | null>(null);
  const textInputRef = useRef<TextInput>(null);

  const seconds = useRef<number>(InitialTime);
  const [isRunning, setIsRunning] = useState<boolean | null>(false);

  const handleStart = useCallback((): void => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    setIsRunning(true);
    intervalId.current = setInterval(() => {
      seconds.current -= 1;
      textInputRef.current?.setNativeProps({
        text: seconds.current.toString(),
      });
      if (seconds.current <= 0) {
        if (intervalId.current !== null) {
          intervalId.current = null;
          setIsRunning(false);
        }
        seconds.current = 0;
        textInputRef.current?.setNativeProps({ text: '0' });
      }
    }, 1000);
  }, []);

  const handleStop = useCallback((): void => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
      setIsRunning(null);
    }
  }, []);

  const handleReset = useCallback((): void => {
    if (intervalId.current !== null) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
    setIsRunning(false);
    seconds.current = InitialTime;
    textInputRef.current?.setNativeProps({ text: '0' });
  }, []);

  const saveState = async () => {
    try {
      const now = Date.now();
      await AsyncStorage.setItem('saveTime', seconds.current.toString());
      await AsyncStorage.setItem('lastTimeStamp', now.toString());
      if (isRunning === true) {
        await AsyncStorage.setItem('isRunning', 'true');
      } else {
        await AsyncStorage.removeItem('isRunning');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadState = async () => {
    try {
      const savedSeconds = await AsyncStorage.getItem('saveTime');
      const lastTimeStamp = await AsyncStorage.getItem('lastTimeStamp');
      const isRunning = await AsyncStorage.getItem('isRunning');

      if (savedSeconds) {
        let currentSeconds = parseInt(savedSeconds);
        if (isRunning === 'true' && lastTimeStamp) {
          const now = Date.now();
          const timePassed = Math.floor((now - parseInt(lastTimeStamp)) / 1000);
          currentSeconds -= timePassed;
          if (currentSeconds < 0) currentSeconds = 0;
          seconds.current = currentSeconds;
          textInputRef.current?.setNativeProps({
            text: currentSeconds.toString(),
          });
          if (currentSeconds > 0 && isRunning === 'true') {
            handleStart();
          } else if (currentSeconds > 0) {
            setIsRunning(null);
          } else {
            handleReset();
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        saveState();
      } else if (nextAppState === 'active') {
        loadState();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isRunning]);
  return (
    <>
      <View style={styles.container}>
        <Text>Time passed:</Text>
        <TextInput
          ref={textInputRef}
          style={styles.timerText}
          defaultValue="100"
        />
      </View>
      <Button
        color="green"
        title={seconds.current < 100 ? 'Continue' : 'Start'}
        onPress={handleStart}
        disabled={!!isRunning}
      />
      <Button
        color="red"
        title="Stop"
        onPress={handleStop}
        disabled={!isRunning}
      />
      <Button
        color="blue"
        title="Reset"
        onPress={handleReset}
        disabled={!isRunning && seconds.current === 0}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  timerText: { fontSize: 70, marginBottom: 20 },
  background: { flex: 1 },
});
