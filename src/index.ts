import { Hono } from 'hono'
import { bearerAuth } from 'hono/bearer-auth'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'
import { convertToMarkdown } from './convertToMarkdown'
import { HTTPException } from 'hono/http-exception'

interface Secrets {
  Bindings: {
    BEARER_AUTH: string,
    GEMINI_API_KEY: string
  }
}

const app = new Hono<Secrets>()

app.use(logger())
app.use(secureHeaders())
app.use(bearerAuth({
  verifyToken: async (token, c) => {
    if (!c.env.BEARER_AUTH) {
      console.error('BEARER_AUTH is not set')
      return false
    }
    return token === c.env.BEARER_AUTH
  },
}))

app.post('/', async (c) => {
  if (c.env.GEMINI_API_KEY === undefined) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  const { image: base64 } = await c.req.json()
  const markdown = await convertToMarkdown(base64, c.env.GEMINI_API_KEY)
  return c.text(markdown)
})

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    switch (err.status) {
      case 400:
        return c.text("Bad Request", 400)
      case 401:
        return c.text("Unauthorized", 401)
      default:
        return c.text("Internal Server Error", 500)
    }
  }
  console.error(err)
  return c.text("Internal Server Error", 500)
})

export default app
