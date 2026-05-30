/**
 * Transforms an upload response URL from the internal MinIO host to the
 * public CDN host. Mirrors the same logic as FileInput.vue in vue-e-learning:
 *   transformedUrl = 'https://' + url.replace(urlTransformFrom, urlTransformTo)
 *
 * Config env vars:
 *   NUXT_PUBLIC_FILE_URL_TRANSFORM_FROM (default: minio:9000)
 *   NUXT_PUBLIC_FILE_URL_TRANSFORM_TO   (default: s3.minio.imaremaritimjakarta.id)
 */
export function useFileUrl() {
  const config = useRuntimeConfig()
  const from = config.public.fileUrlTransformFrom as string || 'minio:9000'
  const to   = config.public.fileUrlTransformTo   as string || 's3.minio.imaremaritimjakarta.id'

  function transformUrl(url: string): string {
    if (!url) return url
    // Already a proper https URL pointing to the public host — return as-is
    if (url.startsWith('https://') && url.includes(to)) return url
    // Strip any existing scheme so we can reliably prefix with https://
    const stripped = url.replace(/^https?:\/\//, '').replace(from, to)
    return 'https://' + stripped
  }

  return { transformUrl }
}
