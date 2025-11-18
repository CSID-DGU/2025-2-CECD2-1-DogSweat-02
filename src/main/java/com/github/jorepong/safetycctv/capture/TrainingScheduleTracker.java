package com.github.jorepong.safetycctv.capture;

import java.time.LocalDateTime;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import org.springframework.stereotype.Component;

@Component
public class TrainingScheduleTracker {

    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();
    private LocalDateTime nextTrainingTime;

    public TrainingScheduleTracker() {
        // Initialize with the initial delay of the scheduler (10 minutes)
        this.nextTrainingTime = LocalDateTime.now().plusMinutes(10);
    }

    public void updateNextTrainingTime(LocalDateTime nextTime) {
        lock.writeLock().lock();
        try {
            this.nextTrainingTime = nextTime;
        } finally {
            lock.writeLock().unlock();
        }
    }

    public LocalDateTime getNextTrainingTime() {
        lock.readLock().lock();
        try {
            return this.nextTrainingTime;
        } finally {
            lock.readLock().unlock();
        }
    }
}
