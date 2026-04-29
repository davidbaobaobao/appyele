export async function revalidateYeleSite(path = '/') {
  try {
    await fetch('https://yele.design/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': process.env.NEXT_PUBLIC_REVALIDATE_SECRET!,
      },
      body: JSON.stringify({ path }),
    })
  } catch (err) {
    console.error('Revalidation failed:', err)
  }
}
