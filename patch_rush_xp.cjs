const fs = require('fs');

let c = fs.readFileSync('src/pages/Challenges.jsx', 'utf8');

// 1. Add profilesApi + entities to imports
c = c.replace(
  `import { auth, entities, profilesApi, notificationsApi, friendsApi, supabase } from '@/api/supabaseClient';`,
  `import { auth, entities, profilesApi, notificationsApi, friendsApi, supabase } from '@/api/supabaseClient';
import { XP_ACTIONS } from '@/components/game/GameUtils';`
);

// 2. Replace handleTaskToggle to award XP + badge on win
const oldToggle = `  const handleTaskToggle = async (challenge, task, taskIndex) => {
    const tasks = challenge.rush_tasks ? [...challenge.rush_tasks] : [];
    const t = { ...tasks[taskIndex] };
    const alreadyDone = (t.completed_by || []).includes(user.id);

    if (alreadyDone) {
      t.completed_by = t.completed_by.filter(id => id !== user.id);
    } else {
      t.completed_by = [...(t.completed_by || []), user.id];
    }
    tasks[taskIndex] = t;

    // Check if this player just completed all tasks → instant win
    const myDoneCount = tasks.filter(tk => (tk.completed_by || []).includes(user.id)).length;
    const isWinner = myDoneCount === tasks.length;

    const updateObj = { rush_tasks: tasks };
    if (isWinner) {
      updateObj.status = 'completed';
      updateObj.winner_email = user.email;
    }

    await entities.Challenge.update(challenge.id, updateObj);
    queryClient.invalidateQueries({ queryKey: ['challenges'] });

    if (isWinner) {
      toast.success('🏆 You finished all 10 tasks — you win the Rush!');
    } else if (!alreadyDone) {
      toast.success(\`Task marked complete! \${myDoneCount}/\${tasks.length} done\`);
    }
  };`;

const newToggle = `  const handleTaskToggle = async (challenge, task, taskIndex) => {
    const tasks = challenge.rush_tasks ? [...challenge.rush_tasks] : [];
    const t = { ...tasks[taskIndex] };
    const alreadyDone = (t.completed_by || []).includes(user.id);

    if (alreadyDone) {
      t.completed_by = t.completed_by.filter(id => id !== user.id);
    } else {
      t.completed_by = [...(t.completed_by || []), user.id];
    }
    tasks[taskIndex] = t;

    const myDoneCount = tasks.filter(tk => (tk.completed_by || []).includes(user.id)).length;
    const isWinner = myDoneCount === tasks.length;

    const updateObj = { rush_tasks: tasks };
    if (isWinner) {
      updateObj.status = 'completed';
      updateObj.winner_email = user.email;
    }

    await entities.Challenge.update(challenge.id, updateObj);

    // Award 1,000,000 XP + Godly badge on Rush win
    if (isWinner) {
      try {
        const profile = await profilesApi.getByUserId(user.id);
        if (profile) {
          const newXP     = (profile.xp || 0) + XP_ACTIONS.WIN_RUSH;
          const newLevel  = Math.min(Math.floor(newXP / 500) + 1, 50);
          const badges    = [...(profile.badges || [])];
          if (!badges.includes('godly')) badges.push('godly');
          if (!badges.includes('clash_winner')) badges.push('clash_winner');
          await entities.UserProfile.update(profile.id, {
            xp: newXP,
            level: newLevel,
            battles_won: (profile.battles_won || 0) + 1,
            badges,
          });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      } catch (e) { console.error('XP award failed', e); }
    }

    queryClient.invalidateQueries({ queryKey: ['challenges'] });

    if (isWinner) {
      toast.success('🏆 GODLY! You finished all 10 tasks — 1,000,000 XP awarded!');
    } else if (!alreadyDone) {
      toast.success(\`Task marked complete! \${myDoneCount}/\${tasks.length} done\`);
    }
  };`;

if (c.includes('const handleTaskToggle')) {
  c = c.replace(oldToggle, newToggle);
  console.log('✅ handleTaskToggle patched with XP + Godly badge logic');
} else {
  console.log('⚠️  handleTaskToggle not found — make sure Challenges.jsx has the Rush mode already applied');
}

fs.writeFileSync('src/pages/Challenges.jsx', c, 'utf8');
console.log('✅ Challenges.jsx updated');
