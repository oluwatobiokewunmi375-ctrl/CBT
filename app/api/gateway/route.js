import { routeRequest } from '../../../lib/gateway/router'
import { response } from '../../../lib/gateway/response'

export async function POST(req) {
  try {
    const body = await req.json()
    const result = routeRequest(body)

    return Response.json(response(true, result))
  } catch (err) {
    return Response.json(response(false, null, err.message))
  }
}
