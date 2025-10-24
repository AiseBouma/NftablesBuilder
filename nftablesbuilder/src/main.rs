use hex::{FromHex, ToHex};
use openssl::rand::rand_priv_bytes;
use openssl::symm::{Cipher, decrypt};
use settings::{Settings, get_settings};
use signal_hook::flag;
use std::io::{BufRead, BufReader, Write};
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};

fn main() {
    let cipher = Cipher::aes_256_cbc();

    // Generate a key and iv
    let mut key = [0; 32];
    rand_priv_bytes(&mut key).unwrap();
    let mut iv = [0; 32];
    rand_priv_bytes(&mut iv).unwrap();

    let hexkey = key.encode_hex::<String>();
    let hexiv = iv.encode_hex::<String>();

    let hexkeyline = format!("{}\n", hexkey);
    let hexivline = format!("{}\n", hexiv);

    let settings: Settings = get_settings();

    // Spawn the webserver process
    let mut child = Command::new(settings.files.webserver.clone())
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("failed to execute process");

    // Get handles to the child's stdin and stdout
    let child_stdin = child.stdin.as_mut().unwrap();
    let mut child_stdout = BufReader::new(child.stdout.as_mut().unwrap());

    // Send the key and iv to the child process
    child_stdin.write_all(hexkeyline.as_bytes()).unwrap();
    child_stdin.write_all(hexivline.as_bytes()).unwrap();

    let term = Arc::new(AtomicBool::new(false));

    // Ask signal_hook to set the term variable to true
    // when the program receives a SIGTERM kill signal
    flag::register(signal_hook::consts::SIGTERM, Arc::clone(&term)).unwrap();

    // Check the initialization response from the child process
    let mut line = String::new();
    child_stdout.read_line(&mut line).expect("read_line failed");
    if line != "OK\n" {
        eprintln!("Webserver failed to initialize: {}", line);
        return;
    }

    // Do work until the term variable becomes true
    while !term.load(Ordering::Relaxed) {
        line.clear();
        // Read a line from the child's stdout
        child_stdout.read_line(&mut line).expect("read_line failed");
        {
            let encrypted_data = <Vec<u8>>::from_hex(&line.trim()).unwrap();
            let decrypted_data = decrypt(cipher, &key, Some(&iv), &encrypted_data).unwrap();

            // interpret the decrypted data as a string command
            let command = String::from_utf8(decrypted_data).unwrap();
            if command == String::from("install") {
                // run nft -c -f <test file> to check the syntax of the script
                let mut output = Command::new(settings.files.nft.clone())
                    .args(["-c", "-f", settings.files.test.as_str()])
                    .stdout(Stdio::piped())
                    .output()
                    .unwrap();

                // extract the raw bytes that we captured and interpret them as a string
                let _stdout = String::from_utf8(output.stdout).unwrap();
                let mut stderr = String::from_utf8(output.stderr).unwrap();

                if stderr.len() == 0 {
                    // syntax is correct, copy the test file to the conf file
                    output = Command::new("cp")
                        .args([settings.files.test.as_str(), settings.files.conf.as_str()])
                        .stdout(Stdio::piped())
                        .output()
                        .unwrap();
                    stderr = String::from_utf8(output.stderr).unwrap();
                    // if the copy was successful, reload the nftables rules
                    if stderr.len() == 0 {
                        // split the reload command into command and args
                        let restart_args: Vec<String> = settings
                            .commands
                            .reload
                            .split(" ")
                            .map(str::to_string)
                            .collect();
                        if restart_args.len() == 0 {
                            stderr = String::from("Invalid reload command");
                        } else {
                            output = Command::new(restart_args[0].clone())
                                .args(restart_args[1..].iter())
                                .stdout(Stdio::piped())
                                .output()
                                .unwrap();
                            stderr = String::from_utf8(output.stderr).unwrap();
                        }
                        if stderr.len() == 0 {
                            stderr = String::from("OK");
                        }
                    }
                }
                // send the stderr (or "OK") back to the child process
                let hexstr = format!("{}\n", stderr.encode_hex::<String>());
                child_stdin.write_all(hexstr.as_bytes()).unwrap();
            }
        }
    }
}
