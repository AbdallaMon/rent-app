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
