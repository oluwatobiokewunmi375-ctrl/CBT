import { supabase } from "../supabase/client"

export function subscribeExam(examId, callback) {
  return supabase
    .channel("exam-live")
    .on("broadcast", { event: "exam-event" }, callback)
    .subscribe()
}