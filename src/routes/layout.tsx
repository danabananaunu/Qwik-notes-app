import { component$, Slot } from '@builder.io/qwik';

export default component$(() => {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <Slot />
    </main>
  );
});

