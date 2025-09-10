// pm2 start /etc/easypanel/projects/data/newversion/code/cron-jobs/whats-app-reminders.js \
//   --name whatsapp-reminders-always

// 5 minutes

// pm2 start /etc/easypanel/projects/data/newversion/code/cron-jobs/whats-app-reminders.js \
//   --name whatsapp-reminders-5m \
//   --cron "*/5 * * * *" \
//   --no-autorestart

//  6 hours
// pm2 start /etc/easypanel/projects/data/newversion/code/cron-jobs/whats-app-reminders.js \
//   --name whatsapp-reminders-6h \
//   --cron "0 */6 * * *" \
//   --no-autorestart

// pm2 start /etc/easypanel/projects/data/newversion/code/ecosystem.config.cjs

// npm install @prisma/client

// pm2 start npx -- tsx /etc/easypanel/projects/data/newversion/code/src/services/server/whatsapp/cron-jobs/reminder-cron.ts --name reminder-cron
// pm2 restart 1 --cron "*/5 * * * *" --no-autorestart
// pm2 restart 1 --cron "0 */5 * * *" --no-autorestart

// pm2 restart 1 --cron "*/15 * * * *" --no-autorestart
