import { updateLiveStats } from '../../../lib/realtime/streams/liveAggregator'

export async function GET() {
  return Response.json({
    status: 'live',
    data: updateLiveStats({})
  });
}
