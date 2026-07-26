import { Stack } from 'expo-router';

export default function EmployeeSegmentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#050505' },
        animation: 'fade',
      }}
    />
  );
}
