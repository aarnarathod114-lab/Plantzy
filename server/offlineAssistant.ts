/**
 * Rule-based answers used when no AI key is configured or the model call fails.
 * These are general horticultural guidance, not personalised advice, and the
 * API marks them with `isFallback: true` so the UI can say so.
 */
export function offlineAnswer(question: string): string {
  const q = question.toLowerCase();
  const has = (...words: string[]) => words.some((word) => q.includes(word));

  if (has('vacation', 'holiday', 'travel', 'away', 'trip')) {
    return 'Before you travel, water moisture-loving plants thoroughly the day before, group indoor pots together to raise local humidity, and move them a little back from harsh direct sun. Plantzy\'s Vacation and Plant Sitter modes produce a handoff checklist for whoever is looking after them.';
  }
  if (has('droop', 'wilt', 'limp')) {
    return 'Drooping can come from either too little or too much water, so check the soil before reacting. If it is dry several centimetres down, water thoroughly and the plant typically recovers within hours. If it is soggy, hold off, improve airflow and make sure the pot drains freely.';
  }
  if (has('yellow', 'brown', 'spot', 'crisp')) {
    return 'Leaf discolouration has several common causes: uneven watering, low light, dry air, or natural ageing of the oldest leaves. Check soil moisture and drainage first, then look at how much light the plant gets. Change one thing at a time so you can tell what helped.';
  }
  if (has('outside', 'outdoor', 'balcony', 'move')) {
    return 'When moving a plant outdoors or into stronger light, acclimatise it over 5 to 7 days, starting in morning shade. Watch for afternoon heat, strong wind and sudden heavy rain, any of which can shock a plant that was indoors.';
  }
  if (has('water', 'thirsty', 'dry', 'moist')) {
    return 'Rather than watering on fixed days, feel the soil 2 to 5 cm down. If it is still moist, wait a day or two. If it is dry, water thoroughly until it runs from the drainage holes, then empty the saucer.';
  }
  return 'A reliable routine is to check soil moisture before every watering, watch how leaves sit and colour over time, and rotate pots occasionally so growth stays even. Log what you see in Plantzy and the routine adapts to how each plant actually behaves.';
}
