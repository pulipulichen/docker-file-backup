// "*/5 * * * * *"
// 每5秒執行一次
let BACKUP_TO_REMOTE_MINUTE_INTERVAL = process.env.BACKUP_TO_REMOTE_MINUTE_INTERVAL

if (!BACKUP_TO_REMOTE_MINUTE_INTERVAL) {
	BACKUP_TO_REMOTE_MINUTE_INTERVAL = 30
}

if (Number(BACKUP_TO_REMOTE_MINUTE_INTERVAL) >= 60) {
	BACKUP_TO_REMOTE_MINUTE_INTERVAL = 59
}

// console.log({BACKUP_TO_REMOTE_MINUTE_INTERVAL})

const fs = require('fs')
const path = require('path')

const sourcePath = '/data_source/'
const targetPath = '/data_backup/'
const archivePath = '/data_archive/'

process.on('SIGINT', async function() {
	console.log("Caught interrupt signal");
	while (cronLock === true) {
		await sleep(1000)
	}
	process.exit()
	
});

if (fs.existsSync(sourcePath) === false || 
		fs.existsSync(targetPath) === false) {
	console.log('Backup cron is stopped.')
	process.exit()
}

const ShellExec = require('./lib/ShellExec.js')

var CronJob = require('cron').CronJob;

let cronLock = false
new CronJob(
	`* */${BACKUP_TO_REMOTE_MINUTE_INTERVAL} * * * *`,
	rsyncJob,
	null,
	true
)

async function rsyncJob () {
	if (cronLock === true) {
		return false
	}
	cronLock = true

	if (process.env.VERBOSE === 'true') {
		console.log('Run backup job...', new Date() + '')
	}
	
	let foldersInSource = fs.readdirSync(sourcePath)
	for (let i = 0; i < foldersInSource.length; i++) {
		let folderInSource = path.join(sourcePath, foldersInSource[i])
		let folderInTarget = path.join(targetPath, foldersInSource[i])

		if (fs.existsSync(folderInTarget) === false) {
			await ShellExec(`chown root:root /data_backup/`)
			fs.mkdirSync(folderInTarget, {recursive: true})
		}

		//await ShellExec(`rsync -avhz ${folderInSource} ${folderInTarget}`, false)
		await ShellExec(`cp -rf ${folderInSource}/* ${folderInTarget}`, false)


		if (process.env.VERBOSE === 'true') {
			console.log('After sync', folderInTarget)
			await ShellExec(`ls -l ${folderInTarget}`, true)
		}
	}
	
	//await ShellExec(`cd ${sourcePath}; zip ${targetPath}important-backup.zip *`)
	
	//await ShellExec(`7z a ${targetPath}important-backup.zip @.`)
	// process.chdir(sourcePath)
	// await ShellExec(`zip -9jpr ${targetPath}important-backup.zip *`)
	if (process.env.VERBOSE === 'true') {
		console.log('Backup is finished',  new Date() + '')
	}

	cronLock = false
}

async function setupTargetPath() {
	let files = fs.readdirSync(targetPath)
	if (files.length > 0) {
		// 確認每個資料夾底下是否有檔案
		// for (let i = 0; i < files.length; i++) {
		// 	let folder = path.join(targetPath, files[i])
		// 	let subFiles = fs.readdirSync(folder)

		// 	if (subFiles.length > 0) {
		// 		console.log(folder)
		// 		console.log(subFiles)

		// 		console.log('Backup path is not empty. Initialization stop.', targetPath)
		// 		return false
		// 	}
		// 	else {
		// 		break
		// 	}
		// }
		console.log('Backup path is not empty. Initialization stop.', targetPath)
		return false
	}

	await rsyncJob()
	console.log('Backup path is ready.', targetPath)
}

setupTargetPath()

// ---------------------------

let ARCHIVE_SCHEDULE = process.env.ARCHIVE_SCHEDULE
if (fs.existsSync(archivePath) === false) {
	console.log('No archivePath: ' + archivePath + '. Archive cron is stopped.')
	process.exit()
}

// mysql-build-540d75f2
//ARCHIVE_SCHEDULE = 'mysql-build-540d75f2'
if (ARCHIVE_SCHEDULE.split(' ').length !== 6 && 
ARCHIVE_SCHEDULE.split(' ').length !== 5) {
	// 表示不是用標準的cron語法
	let hyperPos = ARCHIVE_SCHEDULE.lastIndexOf('-')
	if (hyperPos !== -1) {
		ARCHIVE_SCHEDULE = ARCHIVE_SCHEDULE.slice(hyperPos + 1)
	}

	ARCHIVE_SCHEDULE = ARCHIVE_SCHEDULE.replace(/[^-.0-9]/g,'')
	ARCHIVE_SCHEDULE = Number(ARCHIVE_SCHEDULE)
	if (isNaN(ARCHIVE_SCHEDULE)) {
		ARCHIVE_SCHEDULE = 0
	}

	let weekOfDay = ARCHIVE_SCHEDULE % 7
	let hour = ARCHIVE_SCHEDULE % 5 + 1	// 只限制在1點到6點之間
	let minute = ARCHIVE_SCHEDULE % 60

	ARCHIVE_SCHEDULE = `0 ${minute} ${hour} * * ${weekOfDay}`

	console.log("ARCHIVE_SCHEDULE is setted as:", ARCHIVE_SCHEDULE)
}



let ARCHIVE_VERSION_LIMIT = process.env.ARCHIVE_VERSION_LIMIT
if (!ARCHIVE_VERSION_LIMIT) {
	ARCHIVE_VERSION_LIMIT = 10
}

function sleep(ms = 500) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

const dayjs = require('dayjs')

var checksum = require('checksum')

let lastChecksum = {}

async function createArchive() {

	let files = fs.readdirSync(targetPath)
	if (files.length === 0) {
		return false
	}
	//console.log({files})

	let dateString = dayjs().format('YYYY_MMDD_HHmmss')
	
	let dirname = `/tmp/archive-${dateString}`

	if (fs.existsSync(dirname) === false) {
		fs.mkdirSync(dirname)
	}
	
	for (let i = 0; i < files.length; i++) {
		//await ShellExec(`7z a ${targetPath}important-backup.zip @.`)
		let filename = files[i]
		process.chdir(path.join(targetPath, filename))
		//console.log('Workdir is', targetPath)
		//await ShellExec(`ls -a`, true)
		//return false
		let zipPath = `${dirname}/${filename}.zip`
		await ShellExec(`zip -9pr ${zipPath} *`, false)

		// 檢查checksum
		if (!lastChecksum[filename]) {
			lastChecksum[filename] = await getLastChecksum(filename)
		}
		let currentChecksum = await getChecksum(zipPath)
		if (lastChecksum[filename] && currentChecksum === lastChecksum[filename]) {
			console.log(`Same archive ${zipPath}`)
			await ShellExec(`rm ${zipPath}`, false)
			continue
		}
		lastChecksum[filename] = currentChecksum

		let archiveDir = path.join(archivePath, `archive-${dateString}`)
		if (fs.existsSync(archiveDir) === false) {
			fs.mkdirSync(archiveDir)
		}

		await ShellExec(`mv ${zipPath} ${archiveDir}`, false)
		console.log(`Create ${archiveDir}/${filename}.zip`)
	}
		
	
	return true
}

async function getLastChecksum(filename) {
	let files = fs.readdirSync(archivePath)
	if (files.length === 0) {
		return false
	}

	let lastFile = files[(files.length - 1)]
	let zipFile = path.join(archivePath, lastFile, filename + '.zip')

	if (fs.existsSync(zipFile) === false) {
		return false
	}

	return await getChecksum(zipFile)
}

async function getChecksum (file) {
	return new Promise((resolve, reject) => {
		checksum.file(file, function (err, sum) {
			if (err) {
				return reject(err)
			}
			return resolve(sum)
		 })
	})
}

const { file } = require('checksum')

async function removeExceededArchives() {
	let files = fs.readdirSync(archivePath)
	let exceededCount = files.length - ARCHIVE_VERSION_LIMIT 
	for (let i = 0; i < exceededCount; i++) {
		fs.unlinkSync(path.join(archivePath, files[i]))
		console.log('Remove exceeded archive: ', path.join(archivePath, files[i]))
	}
}

// console.log(ARCHIVE_SCHEDULE)

new CronJob(
	ARCHIVE_SCHEDULE,
	async function() {
		while (cronLock === true) {
			await sleep()
		}
		cronLock = true
		console.log('Run archive job...')
		if (await createArchive()) {
			await removeExceededArchives()
		}
		
		cronLock = false
	},
	null,
	true
)