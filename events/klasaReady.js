const { Event } = require('klasa');

module.exports = class extends Event {

	async run() {
		// this.client.user.setActivity('Skyra, help', { type: 'LISTENING' })
		await this.client.user.setActivity('Skyra, help', { type: 'LISTENING' })
			.catch(err => this.client.emit('error', err));

		await this.initCleanupTask();
		await this.initBackupTask();
	}

	// If this task is not being run, let's create the
	// ScheduledTask and make it run every 10 minutes.
	async initCleanupTask() {
		const { tasks } = this.client.schedule;
		if (!tasks.some(task => task.taskName === 'cleanup')) {
			await this.client.schedule.create('cleanup', '*/10 * * * *');
		}
	}

	// If this task is not being run, let's create the
	// ScheduledTask and make it run every 10 minutes.
	async initBackupTask() {
		const { tasks } = this.client.schedule;
		if (!tasks.some(task => task.taskName === 'backup')) {
			await this.client.schedule.create('backup', '0 0 * * mon,thu');
		}
	}

};