/**
 * prebuiltStories.js — Built-in social stories for common situations.
 *
 * Each story has:
 *   id, title, emoji, category, description,
 *   pages: [{ text, tip }]
 *
 * Categories: 'daily', 'school', 'social', 'emotions', 'safety'
 */

const prebuiltStories = [
  // ── Daily Routines ──────────────────────────────────────
  {
    id: 'morning-routine',
    title: 'My Morning Routine',
    emoji: '🌅',
    category: 'daily',
    description: 'Steps for getting ready in the morning',
    pages: [
      {
        text: 'When my alarm goes off, it is time to wake up. I can stretch and take a deep breath.',
        tip: 'Try counting to 5 slowly as you stretch.',
      },
      {
        text: 'Next, I go to the bathroom. I wash my face and brush my teeth.',
        tip: 'You can hum your favourite song while brushing — it helps pass the time.',
      },
      {
        text: 'Then I get dressed. I can pick clothes that feel comfortable on my skin.',
        tip: 'Laying out your clothes the night before makes this step easier.',
      },
      {
        text: 'Now it is time for breakfast. I sit at the table and eat my food.',
        tip: 'Having the same breakfast spot every day can feel calming.',
      },
      {
        text: 'I am ready for my day! I did a great job following my morning routine.',
        tip: 'Give yourself a thumbs up — you earned it! 👍',
      },
    ],
  },
  {
    id: 'going-to-bed',
    title: 'Getting Ready for Bed',
    emoji: '🌙',
    category: 'daily',
    description: 'A calming bedtime routine',
    pages: [
      {
        text: 'When it is bedtime, I start to get ready. I put on my pyjamas.',
        tip: 'Choose pyjamas that feel soft and comfortable.',
      },
      {
        text: 'I brush my teeth and wash my face with warm water.',
        tip: 'Warm water can feel soothing and relaxing.',
      },
      {
        text: 'I can read a book or listen to a calm story before sleeping.',
        tip: 'Try to avoid screens for 30 minutes before bed.',
      },
      {
        text: 'I lie down in my bed and close my eyes. I take slow, deep breaths.',
        tip: 'Breathe in for 4 counts, hold for 4, breathe out for 4.',
      },
      {
        text: 'It is okay if I do not fall asleep right away. I will rest quietly. Goodnight!',
        tip: 'A weighted blanket can help some people feel safe and cosy.',
      },
    ],
  },

  // ── School ──────────────────────────────────────────────
  {
    id: 'going-to-school',
    title: 'Going to School',
    emoji: '🏫',
    category: 'school',
    description: 'What to expect on a school day',
    pages: [
      {
        text: 'Today I am going to school. I have my backpack with everything I need.',
        tip: 'A checklist on the fridge can help you remember what to pack.',
      },
      {
        text: 'When I arrive, I go to my classroom and find my seat.',
        tip: 'If your seat has changed, it is okay to ask the teacher.',
      },
      {
        text: 'The teacher will talk and give instructions. I try to listen carefully.',
        tip: 'If the room is too loud, it is okay to use noise-cancelling headphones.',
      },
      {
        text: 'At break time, I can eat my snack and play or take a quiet break.',
        tip: 'You do not have to play with others if you need quiet time.',
      },
      {
        text: 'When school is over, I go home. I did a wonderful job today!',
        tip: 'Tell someone at home one good thing that happened today.',
      },
    ],
  },
  {
    id: 'taking-a-test',
    title: 'Taking a Test',
    emoji: '📝',
    category: 'school',
    description: 'How to handle test days calmly',
    pages: [
      {
        text: 'Today I have a test. Tests help the teacher see what I have learned.',
        tip: 'A test is not about being perfect — it is about doing your best.',
      },
      {
        text: 'I sit at my desk and read each question carefully before answering.',
        tip: 'If a question is hard, skip it and come back to it later.',
      },
      {
        text: 'If I feel nervous, I can take a slow deep breath and tell myself "I can do this."',
        tip: 'Squeeze your hands together and release — this can calm your body.',
      },
      {
        text: 'When I am finished, I check my answers if there is time.',
        tip: 'Double-checking is smart, not slow.',
      },
      {
        text: 'I hand in my test. No matter the result, I am proud that I tried my best.',
        tip: 'Celebrate finishing — that takes courage!',
      },
    ],
  },

  // ── Social Situations ──────────────────────────────────
  {
    id: 'making-friends',
    title: 'Making a New Friend',
    emoji: '🤝',
    category: 'social',
    description: 'Steps for meeting and talking to someone new',
    pages: [
      {
        text: 'Sometimes I see someone I would like to be friends with.',
        tip: 'Look for someone who is doing something you enjoy too.',
      },
      {
        text: 'I can walk up to them and say "Hi, my name is ___. What is your name?"',
        tip: 'A smile can help the other person feel comfortable.',
      },
      {
        text: 'I can ask them a question like "What do you like to do?" or "Can I play too?"',
        tip: 'People usually like talking about things they enjoy.',
      },
      {
        text: 'If they say no, that is okay. It does not mean anything is wrong with me.',
        tip: 'There are many other people who would love to be your friend.',
      },
      {
        text: 'Making friends takes time. Each small conversation is a great step!',
        tip: 'Friendship is like a plant — it grows slowly with kindness.',
      },
    ],
  },
  {
    id: 'waiting-in-line',
    title: 'Waiting in Line',
    emoji: '🧍',
    category: 'social',
    description: 'Staying patient while waiting for your turn',
    pages: [
      {
        text: 'Sometimes I need to wait in line. This can happen at school, shops, or events.',
        tip: 'Knowing that waiting will end can help you feel calmer.',
      },
      {
        text: 'I stand behind the person in front of me and keep my hands to myself.',
        tip: 'You can keep a small fidget in your pocket for times like this.',
      },
      {
        text: 'If I feel bored or frustrated, I can count things around me or hum quietly.',
        tip: 'Try counting backwards from 20 — it keeps your brain busy.',
      },
      {
        text: 'When it is my turn, I step forward. I did a great job waiting!',
        tip: 'Waiting patiently is a skill — and you are getting better at it.',
      },
    ],
  },

  // ── Emotions ───────────────────────────────────────────
  {
    id: 'feeling-angry',
    title: 'When I Feel Angry',
    emoji: '😠',
    category: 'emotions',
    description: 'What to do when anger feels overwhelming',
    pages: [
      {
        text: 'Sometimes I feel angry. My body might feel hot, my fists might clench.',
        tip: 'Noticing anger early is a superpower — you are already being mindful.',
      },
      {
        text: 'Feeling angry is okay. Everyone feels angry sometimes.',
        tip: 'Anger is a real feeling. It does not make you a bad person.',
      },
      {
        text: 'When I am angry, I can take 5 deep breaths or go to a quiet place.',
        tip: 'Try breathing in through your nose and out through your mouth.',
      },
      {
        text: 'I can also squeeze a pillow, draw how I feel, or tell someone I trust.',
        tip: 'Finding YOUR calming tool is important — what works for you?',
      },
      {
        text: 'After I calm down, I can think about what happened and talk about it.',
        tip: 'Talking about anger makes it smaller — not bigger.',
      },
    ],
  },
  {
    id: 'feeling-worried',
    title: 'When I Feel Worried',
    emoji: '😟',
    category: 'emotions',
    description: 'Managing anxious feelings step by step',
    pages: [
      {
        text: 'Sometimes I feel worried. My tummy might hurt or my heart beats fast.',
        tip: 'These body signs are your brain trying to protect you.',
      },
      {
        text: 'It is normal to feel worried. I am not the only one who feels this way.',
        tip: 'Even grown-ups feel worried sometimes.',
      },
      {
        text: 'I can try the "5-4-3-2-1" trick: name 5 things I see, 4 I hear, 3 I touch, 2 I smell, 1 I taste.',
        tip: 'This grounds you in the present moment.',
      },
      {
        text: 'I can also talk to someone I trust about what is worrying me.',
        tip: 'Sharing a worry often makes it feel lighter.',
      },
      {
        text: 'I am brave for facing my worries. I can handle hard things.',
        tip: 'You have gotten through every hard day so far — that is 100% success rate!',
      },
    ],
  },

  // ── Safety ─────────────────────────────────────────────
  {
    id: 'visiting-the-doctor',
    title: 'Visiting the Doctor',
    emoji: '🏥',
    category: 'safety',
    description: 'What happens at a doctor visit',
    pages: [
      {
        text: 'Today I am going to the doctor. The doctor helps keep me healthy.',
        tip: 'You can bring a comfort item like a stuffed animal or blanket.',
      },
      {
        text: 'In the waiting room, I sit and wait for my name to be called.',
        tip: 'Bring a book, tablet, or headphones to help pass the time.',
      },
      {
        text: 'The doctor or nurse might check my height, weight, and temperature.',
        tip: 'These things do not hurt. They are just measurements.',
      },
      {
        text: 'If I need a shot, it might pinch for a second, but it helps my body stay strong.',
        tip: 'Looking away and taking a deep breath can make it easier.',
      },
      {
        text: 'When the visit is over, I can feel proud. I was very brave!',
        tip: 'It is okay to ask for a treat or reward after being brave.',
      },
    ],
  },
  {
    id: 'fire-drill',
    title: 'What is a Fire Drill?',
    emoji: '🔔',
    category: 'safety',
    description: 'Understanding fire drills at school',
    pages: [
      {
        text: 'Sometimes a loud alarm goes off at school. This is called a fire drill.',
        tip: 'Fire drills are practice — there is usually no real fire.',
      },
      {
        text: 'When the alarm sounds, I stop what I am doing and listen to my teacher.',
        tip: 'If the noise is too loud, you can cover your ears gently.',
      },
      {
        text: 'I walk in a line with my class to the meeting spot outside.',
        tip: 'Walking, not running, keeps everyone safe.',
      },
      {
        text: 'We wait outside until the teacher says it is safe to go back inside.',
        tip: 'Fire drills are short — usually just a few minutes.',
      },
      {
        text: 'I did a great job staying calm during the fire drill!',
        tip: 'Knowing what to expect makes fire drills less scary each time.',
      },
    ],
  },
];

export const CATEGORIES = [
  { id: 'all', label: 'All Stories', emoji: '📚' },
  { id: 'daily', label: 'Daily Routines', emoji: '🌅' },
  { id: 'school', label: 'School', emoji: '🏫' },
  { id: 'social', label: 'Social', emoji: '🤝' },
  { id: 'emotions', label: 'Emotions', emoji: '💭' },
  { id: 'safety', label: 'Safety', emoji: '🛡️' },
];

export default prebuiltStories;
