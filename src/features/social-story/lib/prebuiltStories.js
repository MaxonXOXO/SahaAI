/**
 * prebuiltStories.js — Built-in social stories for common situations.
 *
 * Each story has:
 *   id, title, emoji, category, description, coverImagePrompt,
 *   pages: [{ text, tip }]
 *
 * coverImagePrompt: fed to generateStoryImage() on first story open.
 * Result is cached by story.id in storyImageCache (see storyPrompts.js).
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
    illustration: 'morning',
    description: 'Steps for getting ready in the morning',
    coverImagePrompt:
      'a cheerful child waking up in a cozy bedroom, sunlight streaming through the curtains, stretching with a big smile',
    pages: [
      {
        text: 'When my alarm goes off, it is time to wake up. I can stretch and take a deep breath.',
        tip: 'Try counting to 5 slowly as you stretch.',
        imagePrompt:
          'A child sitting up in bed stretching arms wide, gentle sunlight through the window, a smiling alarm clock on the nightstand.',
      },
      {
        text: 'Next, I go to the bathroom. I wash my face and brush my teeth.',
        tip: 'You can hum your favourite song while brushing — it helps pass the time.',
        imagePrompt:
          'A child standing at a bathroom sink brushing teeth, holding a toothbrush, cheerful bubbles in the sink, soft pastel bathroom tiles.',
      },
      {
        text: 'Then I get dressed. I can pick clothes that feel comfortable on my skin.',
        tip: 'Laying out your clothes the night before makes this step easier.',
        imagePrompt:
          'A child picking comfortable folded clothes from a dresser drawer, a cozy bedroom with clothes laid neatly on a chair.',
      },
      {
        text: 'Now it is time for breakfast. I sit at the table and eat my food.',
        tip: 'Having the same breakfast spot every day can feel calming.',
        imagePrompt:
          'A child sitting at a kitchen table eating breakfast from a bowl, a sunny window behind, a calm cheerful morning scene.',
      },
      {
        text: 'I am ready for my day! I did a great job following my morning routine.',
        tip: 'Give yourself a thumbs up — you earned it! 👍',
        imagePrompt:
          'A child standing proudly by the front door with a backpack, giving a thumbs up, morning sunlight streaming in.',
      },
    ],
  },
  {
    id: 'going-to-bed',
    title: 'Getting Ready for Bed',
    emoji: '🌙',
    category: 'daily',
    illustration: 'bedtime',
    description: 'A calming bedtime routine',
    coverImagePrompt:
      'a child in soft cozy pajamas reading a picture book in a warm lamp-lit bedroom at night, moon visible through window',
    pages: [
      {
        text: 'When it is bedtime, I start to get ready. I put on my pyjamas.',
        tip: 'Choose pyjamas that feel soft and comfortable.',
        imagePrompt:
          'A child putting on soft pyjamas in a dim cozy bedroom, a nightlight glowing gently in the corner.',
      },
      {
        text: 'I brush my teeth and wash my face with warm water.',
        tip: 'Warm water can feel soothing and relaxing.',
        imagePrompt:
          'A child washing their face at a bathroom sink with warm water, a soft towel hanging nearby, calm evening light.',
      },
      {
        text: 'I can read a book or listen to a calm story before sleeping.',
        tip: 'Try to avoid screens for 30 minutes before bed.',
        imagePrompt:
          'A child sitting on a bed holding an open picture book, a soft lamp glowing beside a cozy blanket.',
      },
      {
        text: 'I lie down in my bed and close my eyes. I take slow, deep breaths.',
        tip: 'Breathe in for 4 counts, hold for 4, breathe out for 4.',
        imagePrompt:
          'A child lying peacefully in bed with eyes closed, blanket tucked in, a calm crescent moon glowing through the window.',
      },
      {
        text: 'It is okay if I do not fall asleep right away. I will rest quietly. Goodnight!',
        tip: 'A weighted blanket can help some people feel safe and cosy.',
        imagePrompt:
          'A sleepy child resting quietly under a blanket, stars twinkling softly outside the window, a peaceful bedroom at night.',
      },
    ],
  },

  // ── School ──────────────────────────────────────────────
  {
    id: 'going-to-school',
    title: 'Going to School',
    emoji: '🏫',
    category: 'school',
    illustration: 'school',
    description: 'What to expect on a school day',
    coverImagePrompt:
      'a happy child carrying a colorful backpack walking toward a bright friendly school building on a sunny morning',
    pages: [
      {
        text: 'Today I am going to school. I have my backpack with everything I need.',
        tip: 'A checklist on the fridge can help you remember what to pack.',
        imagePrompt:
          'A child standing by the front door holding a packed backpack, a checklist nearby, a bright cheerful morning.',
      },
      {
        text: 'When I arrive, I go to my classroom and find my seat.',
        tip: 'If your seat has changed, it is okay to ask the teacher.',
        imagePrompt:
          'A child walking into a cheerful classroom with desks and chairs, finding a seat near a window.',
      },
      {
        text: 'The teacher will talk and give instructions. I try to listen carefully.',
        tip: 'If the room is too loud, it is okay to use noise-cancelling headphones.',
        imagePrompt:
          'A child sitting at a desk looking at a friendly teacher pointing to a whiteboard in a calm classroom.',
      },
      {
        text: 'At break time, I can eat my snack and play or take a quiet break.',
        tip: 'You do not have to play with others if you need quiet time.',
        imagePrompt:
          'A child sitting quietly on a bench eating a snack in a cheerful schoolyard with soft green grass.',
      },
      {
        text: 'When school is over, I go home. I did a wonderful job today!',
        tip: 'Tell someone at home one good thing that happened today.',
        imagePrompt:
          'A child walking home from school smiling, backpack on, warm afternoon sunlight and a quiet street.',
      },
    ],
  },
  {
    id: 'taking-a-test',
    title: 'Taking a Test',
    emoji: '📝',
    category: 'school',
    illustration: 'test',
    description: 'How to handle test days calmly',
    coverImagePrompt:
      'a calm child sitting at a school desk carefully writing on a test paper, soft classroom light, pencil in hand',
    pages: [
      {
        text: 'Today I have a test. Tests help the teacher see what I have learned.',
        tip: 'A test is not about being perfect — it is about doing your best.',
        imagePrompt:
          'A child sitting at a desk looking at a blank test paper, a calm focused expression, soft classroom light.',
      },
      {
        text: 'I sit at my desk and read each question carefully before answering.',
        tip: 'If a question is hard, skip it and come back to it later.',
        imagePrompt:
          'A child reading a paper closely with a pencil in hand, a quiet thoughtful classroom scene.',
      },
      {
        text: 'If I feel nervous, I can take a slow deep breath and tell myself "I can do this."',
        tip: 'Squeeze your hands together and release — this can calm your body.',
        imagePrompt:
          'A child sitting at a desk taking a slow deep breath, eyes closed, hand resting calmly on the desk.',
      },
      {
        text: 'When I am finished, I check my answers if there is time.',
        tip: 'Double-checking is smart, not slow.',
        imagePrompt:
          'A child reviewing a finished test paper with a pencil, a calm satisfied expression at a classroom desk.',
      },
      {
        text: 'I hand in my test. No matter the result, I am proud that I tried my best.',
        tip: 'Celebrate finishing — that takes courage!',
        imagePrompt:
          'A child handing a paper to a smiling teacher, standing proudly beside a classroom desk.',
      },
    ],
  },

  // ── Social Situations ──────────────────────────────────
  {
    id: 'making-friends',
    title: 'Making a New Friend',
    emoji: '🤝',
    category: 'social',
    illustration: 'friends',
    description: 'Steps for meeting and talking to someone new',
    coverImagePrompt:
      'two children smiling and waving hello to each other on a colorful sunny playground, both looking happy and kind',
    pages: [
      {
        text: 'Sometimes I see someone I would like to be friends with.',
        tip: 'Look for someone who is doing something you enjoy too.',
        imagePrompt:
          'A child watching another child playing happily nearby on a sunny playground, a curious friendly expression.',
      },
      {
        text: 'I can walk up to them and say "Hi, my name is ___. What is your name?"',
        tip: 'A smile can help the other person feel comfortable.',
        imagePrompt:
          'Two children standing face to face, one waving and smiling, on a cheerful playground.',
      },
      {
        text: 'I can ask them a question like "What do you like to do?" or "Can I play too?"',
        tip: 'People usually like talking about things they enjoy.',
        imagePrompt:
          'Two children sitting together talking, one asking a question with an open curious expression, playground background.',
      },
      {
        text: 'If they say no, that is okay. It does not mean anything is wrong with me.',
        tip: 'There are many other people who would love to be your friend.',
        imagePrompt:
          'A child standing alone but calm and okay, looking forward with a gentle reassuring expression, soft background.',
      },
      {
        text: 'Making friends takes time. Each small conversation is a great step!',
        tip: 'Friendship is like a plant — it grows slowly with kindness.',
        imagePrompt:
          'Two children playing happily together with a ball on a sunny playground, warm cheerful colors.',
      },
    ],
  },
  {
    id: 'waiting-in-line',
    title: 'Waiting in Line',
    emoji: '🧍',
    category: 'social',
    illustration: 'waitingLine',
    description: 'Staying patient while waiting for your turn',
    coverImagePrompt:
      'a child standing patiently in a short, orderly queue holding a small fidget toy, calm and relaxed expression',
    pages: [
      {
        text: 'Sometimes I need to wait in line. This can happen at school, shops, or events.',
        tip: 'Knowing that waiting will end can help you feel calmer.',
        imagePrompt:
          'A child standing calmly behind another person in a gentle line, a cheerful shop or event setting.',
      },
      {
        text: 'I stand behind the person in front of me and keep my hands to myself.',
        tip: 'You can keep a small fidget in your pocket for times like this.',
        imagePrompt:
          'A child standing quietly with hands folded, a small fidget toy in hand, calm queue scene.',
      },
      {
        text: 'If I feel bored or frustrated, I can count things around me or hum quietly.',
        tip: 'Try counting backwards from 20 — it keeps your brain busy.',
        imagePrompt:
          'A child standing in line quietly humming, looking around calmly, a soft warm setting.',
      },
      {
        text: 'When it is my turn, I step forward. I did a great job waiting!',
        tip: 'Waiting patiently is a skill — and you are getting better at it.',
        imagePrompt:
          'A child stepping forward happily as it becomes their turn, a cheerful counter or entrance ahead.',
      },
    ],
  },

  // ── Emotions ───────────────────────────────────────────
  {
    id: 'feeling-angry',
    title: 'When I Feel Angry',
    emoji: '😠',
    category: 'emotions',
    illustration: 'calmAnger',
    description: 'What to do when anger feels overwhelming',
    coverImagePrompt:
      'a child sitting quietly in a calm cozy corner, eyes closed, taking a slow deep breath, peaceful expression on their face',
    pages: [
      {
        text: 'Sometimes I feel angry. My body might feel hot, my fists might clench.',
        tip: 'Noticing anger early is a superpower — you are already being mindful.',
        imagePrompt:
          'A child with clenched fists and a frustrated expression, a warm orange glow around them, simple background.',
      },
      {
        text: 'Feeling angry is okay. Everyone feels angry sometimes.',
        tip: 'Anger is a real feeling. It does not make you a bad person.',
        imagePrompt:
          'A child sitting calmly with a gentle understanding expression, a soft warm glow, reassuring simple scene.',
      },
      {
        text: 'When I am angry, I can take 5 deep breaths or go to a quiet place.',
        tip: 'Try breathing in through your nose and out through your mouth.',
        imagePrompt:
          'A child sitting alone in a cozy quiet corner taking a deep breath, calming pastel colors.',
      },
      {
        text: 'I can also squeeze a pillow, draw how I feel, or tell someone I trust.',
        tip: 'Finding YOUR calming tool is important — what works for you?',
        imagePrompt:
          'A child hugging a soft pillow and drawing on paper, a calm cozy room, soft colors.',
      },
      {
        text: 'After I calm down, I can think about what happened and talk about it.',
        tip: 'Talking about anger makes it smaller — not bigger.',
        imagePrompt:
          'A child talking calmly with a caring adult, both seated, warm gentle expressions, soft cozy room.',
      },
    ],
  },
  {
    id: 'feeling-worried',
    title: 'When I Feel Worried',
    emoji: '😟',
    category: 'emotions',
    illustration: 'calmWorry',
    description: 'Managing anxious feelings step by step',
    coverImagePrompt:
      'a child sitting comfortably with a kind trusted adult, both looking calm and relaxed, having a gentle supportive conversation',
    pages: [
      {
        text: 'Sometimes I feel worried. My tummy might hurt or my heart beats fast.',
        tip: 'These body signs are your brain trying to protect you.',
        imagePrompt:
          'A child with a worried expression holding their stomach gently, soft blue calming background.',
      },
      {
        text: 'It is normal to feel worried. I am not the only one who feels this way.',
        tip: 'Even grown-ups feel worried sometimes.',
        imagePrompt:
          'A child sitting calmly with a gentle reassuring expression, warm soft colors, simple background.',
      },
      {
        text: 'I can try the "5-4-3-2-1" trick: name 5 things I see, 4 I hear, 3 I touch, 2 I smell, 1 I taste.',
        tip: 'This grounds you in the present moment.',
        imagePrompt:
          'A child looking around calmly at simple objects, a gentle focused expression, soft grounding scene.',
      },
      {
        text: 'I can also talk to someone I trust about what is worrying me.',
        tip: 'Sharing a worry often makes it feel lighter.',
        imagePrompt:
          'A child talking to a caring adult who is listening kindly, warm gentle colors.',
      },
      {
        text: 'I am brave for facing my worries. I can handle hard things.',
        tip: 'You have gotten through every hard day so far — that is 100% success rate!',
        imagePrompt:
          'A child standing tall with a confident gentle smile, a warm glowing sunrise background.',
      },
    ],
  },

  // ── Safety ─────────────────────────────────────────────
  {
    id: 'visiting-the-doctor',
    title: 'Visiting the Doctor',
    emoji: '🏥',
    category: 'safety',
    illustration: 'doctor',
    description: 'What happens at a doctor visit',
    coverImagePrompt:
      'a friendly smiling doctor in a white coat kneeling to greet a child in a bright clean welcoming examination room',
    pages: [
      {
        text: 'Today I am going to the doctor. The doctor helps keep me healthy.',
        tip: 'You can bring a comfort item like a stuffed animal or blanket.',
        imagePrompt:
          'A child walking into a friendly medical office holding a stuffed animal, calm warm colors.',
      },
      {
        text: 'In the waiting room, I sit and wait for my name to be called.',
        tip: 'Bring a book, tablet, or headphones to help pass the time.',
        imagePrompt:
          'A child sitting quietly in a waiting room chair with a book, calm simple setting.',
      },
      {
        text: 'The doctor or nurse might check my height, weight, and temperature.',
        tip: 'These things do not hurt. They are just measurements.',
        imagePrompt:
          'A friendly doctor gently checking a calm child near a height measuring chart, soft clinic colors.',
      },
      {
        text: 'If I need a shot, it might pinch for a second, but it helps my body stay strong.',
        tip: 'Looking away and taking a deep breath can make it easier.',
        imagePrompt:
          'A child looking away calmly while a friendly nurse gives a gentle arm check, warm reassuring colors.',
      },
      {
        text: 'When the visit is over, I can feel proud. I was very brave!',
        tip: 'It is okay to ask for a treat or reward after being brave.',
        imagePrompt:
          'A child smiling proudly outside a medical office holding a small reward sticker, warm cheerful colors.',
      },
    ],
  },
  {
    id: 'fire-drill',
    title: 'What is a Fire Drill?',
    emoji: '🔔',
    category: 'safety',
    illustration: 'fireDrill',
    description: 'Understanding fire drills at school',
    coverImagePrompt:
      'a calm and orderly line of children walking outside a school building on a sunny day, teacher leading them safely',
    pages: [
      {
        text: 'Sometimes a loud alarm goes off at school. This is called a fire drill.',
        tip: 'Fire drills are practice — there is usually no real fire.',
        imagePrompt:
          'A school hallway with a gentle alarm bell shown softly on the wall, children looking calmly toward a teacher.',
      },
      {
        text: 'When the alarm sounds, I stop what I am doing and listen to my teacher.',
        tip: 'If the noise is too loud, you can cover your ears gently.',
        imagePrompt:
          'A child covering ears gently while listening to a calm teacher pointing toward an exit.',
      },
      {
        text: 'I walk in a line with my class to the meeting spot outside.',
        tip: 'Walking, not running, keeps everyone safe.',
        imagePrompt:
          'A line of children walking calmly outside together following a teacher, clear sky above.',
      },
      {
        text: 'We wait outside until the teacher says it is safe to go back inside.',
        tip: 'Fire drills are short — usually just a few minutes.',
        imagePrompt:
          'Children standing calmly together outside a school building, a teacher nearby, calm blue sky.',
      },
      {
        text: 'I did a great job staying calm during the fire drill!',
        tip: 'Knowing what to expect makes fire drills less scary each time.',
        imagePrompt:
          'A child smiling calmly outside after a fire drill, standing with classmates, warm reassuring colors.',
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
