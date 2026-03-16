#include <tunables/global>

profile codespace-op-workspace flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>
  #include <abstractions/nameservice>
  #include <abstractions/bash>

  # Allow read access to common locations
  /home/coder/** rw,
  /tmp/** rw,
  /usr/** r,
  /lib/** r,
  /etc/** r,
  /proc/** r,
  /sys/fs/cgroup/** r,
  /dev/null rw,
  /dev/urandom r,
  /dev/tty rw,
  /dev/pts/* rw,

  # Allow execution of common tools
  /usr/bin/* ix,
  /usr/local/bin/* ix,
  /bin/* ix,
  /home/coder/.local/bin/* ix,

  # Deny dangerous operations
  deny /proc/sys/kernel/** w,
  deny /sys/** w,
  deny /etc/shadow r,
  deny /etc/passwd w,
  deny /etc/hosts w,
  deny /root/** rwx,
  deny mount,
  deny umount,
  deny ptrace,
  deny signal (send) peer=unconfined,

  # Deny network raw sockets (prevent packet sniffing)
  deny network raw,
  deny network packet,

  # Deny kernel module loading
  deny @{PROC}/sys/kernel/modprobe w,
  deny capability sys_module,

  # Deny access to Docker socket from workspace
  deny /var/run/docker.sock rw,

  # Capabilities
  capability dac_override,
  capability setuid,
  capability setgid,
  capability chown,
  capability fowner,
  capability kill,
  capability net_bind_service,
}
