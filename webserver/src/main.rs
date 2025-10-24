use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use axum::extract::{self, Path};
use axum::http::StatusCode;
use axum::Json;
use axum::{extract::State, routing::post};
use axum::{routing::get, Router};
use axum_server::tls_rustls::RustlsConfig;
use network_interface::NetworkInterface;
use network_interface::NetworkInterfaceConfig;
use openssl::symm::{encrypt, Cipher};
use serde::{Deserialize, Serialize};
use settings::{get_settings, Settings};
use std::cmp;
use std::collections::HashMap;
use std::path::PathBuf;
use std::vec;
use std::{net::SocketAddr, sync::Arc};
use thotp::encoding::data_encoding;
use thotp::qr::otp_uri;
use thotp::verify_totp;
use thotp::{encoding::encode, generate_secret, qr::generate_code_svg, qr::EcLevel};
use time::Duration;
use tokio::fs;
use tokio::io::{self, AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::lookup_host;
use tokio::sync::Mutex;
use tower_http::services::{ServeDir, ServeFile};
use tower_sessions::{session::Id, Expiry, MemoryStore, Session, SessionManagerLayer};
use walkdir::WalkDir;

#[derive(Deserialize, Serialize)]
struct TotpSecret {
    secret: String,
    svg: String,
}

#[derive(Deserialize, Serialize)]
struct User {
    username: String,
    password: String,
    secret: String,
}

#[derive(Deserialize, Serialize)]
struct LoginData {
    username: String,
    password: String,
    mfa: String,
}
struct AppState {
    current_session: Mutex<Option<Id>>,
    no_session: Mutex<Option<Id>>,
    reader: Mutex<BufReader<io::Stdin>>,
    cipher: Mutex<Cipher>,
    key: Mutex<Vec<u8>>,
    iv: Mutex<Vec<u8>>,
    settings: Mutex<Settings>,
}

#[derive(Default, Deserialize, Serialize)]
struct NwInterface {
    name: String,
    addresses: String,
}

#[derive(Deserialize, Serialize)]
struct Addrs {
    host: String,
    ipv4: String,
    ipv6: String,
}

#[derive(Deserialize, Serialize)]
struct Configuration {
    name: String,
    json: String,
}

#[derive(Default, Deserialize, Serialize)]
struct InterfaceData {
    systemname: String,
    addresses: String,
    loopback: bool,
}

#[derive(Default, Deserialize, Serialize)]
struct HostData {
    ipv4: Vec<String>,
    ipv6: Vec<String>,
}

#[derive(Default, Deserialize, Serialize)]
struct ServiceData {
    port: u16,
    protocol: String,
    default: bool,
}

#[derive(Default, Deserialize, Serialize, Clone)]
struct ChainData {
    filter: bool,
    snat: bool,
    dnat: bool,
    iface_in: String,
    iface_out: String,
    direction: String,
    policy: String,
}

#[derive(Default, Deserialize, Serialize, Clone)]
struct FilterRuleData {
    source: Vec<String>,
    sourceservice: Vec<String>,
    destination: Vec<String>,
    destinationservice: Vec<String>,
    action: String,
    comment: String,
    active: bool,
}

#[derive(Default, Deserialize, Serialize, Clone)]
struct FilterTableData {
    chain: String,
    policy: String,
    rules: Vec<FilterRuleData>,
    deleted: bool,
}

#[derive(Default, Deserialize, Serialize)]
struct PosData {
    top: f32,
    left: f32,
}

#[derive(Default, Deserialize, Serialize)]
struct FilterData {
    filtertables: Vec<FilterTableData>,
    dragpos: Vec<PosData>,
}

#[derive(Default, Deserialize, Serialize, Clone)]
struct NatRuleData {
    source: Vec<String>,
    sourceservice: Vec<String>,
    destination: Vec<String>,
    destinationservice: Vec<String>,
    translated: String,
    translatedservice: String,
    comment: String,
    active: bool,
}

#[derive(Default, Deserialize, Serialize, Clone)]
struct NatTableData {
    chain: String,
    policy: String,
    rules: Vec<NatRuleData>,
    deleted: bool,
}

#[derive(Default, Deserialize, Serialize)]
struct NatData {
    nattables: Vec<NatTableData>,
    dragpos: Vec<PosData>,
}

#[derive(Serialize, Deserialize)]
struct ConfigurationItems {
    interfaces: HashMap<String, InterfaceData>,
    hosts: HashMap<String, HostData>,
    hostgroups: HashMap<String, Vec<String>>,
    ipv4networks: HashMap<String, String>,
    ipv6networks: HashMap<String, String>,
    services: HashMap<String, ServiceData>,
    chains: HashMap<String, ChainData>,
    inactive_defaults: Vec<String>,
    filters: FilterData,
    pre: String,
    post: String,
    snat: NatData,
    dnat: NatData,
    logging: String,
    checksdragpos: PosData,
}

fn tcp_ports_from_services(
    config_items: &ConfigurationItems,
    services: &Vec<String>,
) -> Vec<String> {
    let mut ports: Vec<String> = vec![];
    for svc in services.iter() {
        if let Some(service) = config_items.services.get(svc) {
            if service.protocol.contains("TCP") {
                ports.push(format!("{}", service.port));
            }
        }
    }
    return ports;
}

fn udp_ports_from_services(
    config_items: &ConfigurationItems,
    services: &Vec<String>,
) -> Vec<String> {
    let mut ports: Vec<String> = vec![];
    for svc in services.iter() {
        if let Some(service) = config_items.services.get(svc) {
            if service.protocol.contains("UDP") {
                ports.push(format!("{}", service.port));
            }
        }
    }
    return ports;
}

fn icmpv4_types_from_services(services: &Vec<String>) -> Vec<String> {
    let mut types: Vec<String> = vec![];
    for svc in services.iter() {
        if svc.len() > 11 && svc[0..12] == *"ICMPv4 Type " {
            let parts: Vec<&str> = svc.splitn(3, ' ').collect();
            if parts.len() == 3 {
                types.push(parts[2].to_string());
            }
        }
    }
    return types;
}

fn icmpv6_types_from_services(services: &Vec<String>) -> Vec<String> {
    let mut types: Vec<String> = vec![];
    for svc in services.iter() {
        if svc.len() > 11 && svc[0..12] == *"ICMPv6 Type " {
            let parts: Vec<&str> = svc.splitn(3, ' ').collect();
            if parts.len() == 3 {
                types.push(parts[2].to_string());
            }
        }
    }
    return types;
}

fn ipv4addresses_from_def(config_items: &ConfigurationItems, def: &String) -> Vec<String> {
    let mut ips: Vec<String> = vec![];

    // check host data
    if let Some(h) = config_items.hosts.get(def) {
        for ip in h.ipv4.iter() {
            if !ips.contains(ip) {
                ips.push(ip.clone());
            }
        }
    }

    // check hostgroup data
    if let Some(g) = config_items.hostgroups.get(def) {
        for h in g.iter() {
            if let Some(hdata) = config_items.hosts.get(h) {
                for ip in hdata.ipv4.iter() {
                    if !ips.contains(ip) {
                        ips.push(ip.clone());
                    }
                }
            }
        }
    }
    // check network data
    if let Some(n) = config_items.ipv4networks.get(def) {
        if !ips.contains(n) {
            ips.push(n.clone());
        }
    }
    return ips;
}

fn ipv6addresses_from_def(config_items: &ConfigurationItems, def: &String) -> Vec<String> {
    let mut ips: Vec<String> = vec![];

    // check host data
    if let Some(h) = config_items.hosts.get(def) {
        for ip in h.ipv6.iter() {
            if !ips.contains(ip) {
                ips.push(ip.clone());
            }
        }
    }

    // check hostgroup data
    if let Some(g) = config_items.hostgroups.get(def) {
        for h in g.iter() {
            if let Some(hdata) = config_items.hosts.get(h) {
                for ip in hdata.ipv6.iter() {
                    if !ips.contains(ip) {
                        ips.push(ip.clone());
                    }
                }
            }
        }
    }
    // check network data
    if let Some(n) = config_items.ipv6networks.get(def) {
        if !ips.contains(n) {
            ips.push(n.clone());
        }
    }
    return ips;
}

fn get_interface(config_items: &ConfigurationItems, name: &String) -> Result<String, String> {
    let iface = config_items.interfaces.get(name);
    match iface {
        Some(i) => return Ok(i.systemname.clone()),
        None => return Err(format!("Interface {} not found", name)),
    }
}

fn get_chain(config_items: &ConfigurationItems, name: &String) -> Result<ChainData, String> {
    let chain = config_items.chains.get(name);
    match chain {
        Some(c) => return Ok((*c).clone()),
        None => return Err(format!("Chain {} not found", name)),
    }
}

fn chain_on_loopback(config_items: &ConfigurationItems, chain: &ChainData) -> bool {
    if chain.iface_in != "-" {
        if let Some(iface) = config_items.interfaces.get(&chain.iface_in) {
            return iface.loopback;
        }
    }
    if chain.iface_out != "-" {
        if let Some(iface) = config_items.interfaces.get(&chain.iface_out) {
            return iface.loopback;
        }
    }
    return false;
}

fn add_natrule_to_filter(
    script: Vec<String>,
    chain: &String,
    line: &String,
    limit: &String,
) -> Vec<String> {
    let mut newscript = Vec::new();
    for l in script {
        newscript.push(l.clone());
        if l.trim() == format!("chain {} {{", chain) {
            newscript.push(format!("{}{} accept # allow nat rule", line, limit));
        }
    }
    newscript
}

fn addcounters(script: Vec<String>, counters: Vec<String>) -> Vec<String> {
    let mut newscript = Vec::new();
    for l in script {
        newscript.push(l.clone());
        if l.trim() == "# Counters" {
            for counter in counters.iter() {
                newscript.push(format!("  counter {} {{", counter));
                newscript.push(format!("  }}"));
            }
        }
    }
    newscript
}

fn logcommand(counters: &mut Vec<String>, logging: &String, chain: &String, name: &str) -> String {
    let idstring = format!("{}_{}_{}", logging, chain, name);
    if logging == "counter" {
        if !counters.contains(&idstring) {
            counters.push(idstring.clone());
        }
        return format!("counter name {} ", idstring);
    }
    if logging == "log" {
        return format!("log prefix {} ", idstring);
    }
    return String::from("");
}

fn netdev_logcommand(logging: &String) -> String {
    if logging == "counter" {
        return format!("counter name counter_netdev_invalid_tcp ");
    }
    if logging == "log" {
        return format!("log prefix log_netdev_invalid_tcp ");
    }
    return String::from("");
}

fn generate_script(json: String, nft: String) -> Result<Vec<String>, String> {
    let config_items: ConfigurationItems = serde_json::from_str(&json).unwrap();
    let mut script = Vec::new();
    let mut counters = Vec::new();
    script.push(format!("#!{} -f", nft));
    script.push(String::from(""));
    script.push(String::from("#"));
    script.push(String::from("# Script generated by Nftables Builder"));
    script.push(String::from("#"));
    script.push(String::from(""));
    script.push(String::from("# clear existing ruleset"));
    script.push(String::from("flush ruleset"));
    script.push(String::from(""));
    config_items
        .pre
        .lines()
        .for_each(|l| script.push(String::from(l)));
    script.push(String::from("# Filtering rules"));
    script.push(String::from("table inet filter_inet {"));
    if config_items.logging == "counter" {
        script.push(String::from("  # Counters"));
    }
    let mut syn_limit_ipv4_txt = "";
    let mut syn_limit_ipv6_txt = "";
    if !config_items
        .inactive_defaults
        .contains(&String::from("SYNFlood"))
    {
        script.push(format!("  set syn_rate_limit_ipv4 {{ type ipv4_addr"));
        script.push(format!("    timeout 1s"));
        script.push(format!("    flags dynamic"));
        script.push(format!("  }}"));
        script.push(format!("  set syn_rate_limit_ipv6 {{ type ipv6_addr"));
        script.push(format!("    timeout 1s"));
        script.push(format!("    flags dynamic"));
        script.push(format!("  }}"));
        syn_limit_ipv4_txt =
            "ct state new update @syn_rate_limit_ipv4 { ip saddr limit rate 1/second } ";
        syn_limit_ipv6_txt =
            "ct state new update @syn_rate_limit_ipv6 { ip6 saddr limit rate 1/second } ";
    }
    if !config_items
        .inactive_defaults
        .contains(&String::from("ICMP"))
    {
        script.push(format!("  set icmp_rate_limit_ipv4 {{ type ipv4_addr"));
        script.push(format!("    timeout 1s"));
        script.push(format!("    flags dynamic"));
        script.push(format!("  }}"));
        script.push(format!("  set icmp_rate_limit_ipv6 {{ type ipv6_addr"));
        script.push(format!("    timeout 1s"));
        script.push(format!("    flags dynamic"));
        script.push(format!("  }}"));
    }
    if !config_items
        .inactive_defaults
        .contains(&String::from("SRCEQDST"))
    {
        let slice = &config_items.filters.filtertables[..];
        for filtertable in slice.iter().cloned() {
            if filtertable.deleted {
                continue;
            }
            script.push(format!(
                "  set {}_dest_ipv4 {{ type ipv4_addr; }}",
                filtertable.chain
            ));
            script.push(format!(
                "  set {}_dest_ipv6 {{ type ipv6_addr; }}",
                filtertable.chain
            ));
        }
    }
    let slice = &config_items.filters.filtertables[..];
    for filtertable in slice.iter().cloned() {
        if filtertable.deleted {
            continue;
        }

        script.push(format!("  chain {} {{", filtertable.chain));
        let chain = get_chain(&config_items, &filtertable.chain)?;
        if !config_items
            .inactive_defaults
            .contains(&String::from("SRCEQDST"))
            && !chain_on_loopback(&config_items, &chain)
        {
            script.push(format!(
                "    meta nfproto ipv4 update @{}_dest_ipv4 {{ ip daddr }}",
                filtertable.chain
            ));
            script.push(format!(
                "    meta nfproto ipv4 ip saddr @{}_dest_ipv4 {}drop",
                filtertable.chain,
                logcommand(
                    &mut counters,
                    &config_items.logging,
                    &filtertable.chain,
                    "src_eq_dst_ipv4"
                )
            ));
            script.push(format!(
                "    meta nfproto ipv4 delete @{}_dest_ipv4 {{ ip daddr }}",
                filtertable.chain
            ));
            script.push(format!(
                "    meta nfproto ipv6 update @{}_dest_ipv6 {{ ip6 daddr }}",
                filtertable.chain
            ));
            script.push(format!(
                "    meta nfproto ipv6 ip6 saddr @{}_dest_ipv6 {}drop",
                filtertable.chain,
                logcommand(
                    &mut counters,
                    &config_items.logging,
                    &filtertable.chain,
                    "src_eq_dst_ipv6"
                )
            ));
            script.push(format!(
                "    meta nfproto ipv6 delete @{}_dest_ipv6 {{ ip6 daddr }}",
                filtertable.chain
            ));
        }
        if !config_items
            .inactive_defaults
            .contains(&String::from("CT-Established"))
        {
            script.push(format!("    ct state established accept"));
        }
        if !config_items
            .inactive_defaults
            .contains(&String::from("CT-Related"))
        {
            script.push(format!("    ct state related accept"));
        }
        if !config_items
            .inactive_defaults
            .contains(&String::from("CT-Invalid"))
        {
            script.push(format!(
                "    ct state invalid {}drop",
                logcommand(
                    &mut counters,
                    &config_items.logging,
                    &filtertable.chain,
                    "ct_invalid"
                )
            ));
        }
        if !config_items
            .inactive_defaults
            .contains(&String::from("ICMP"))
        {
            script.push(format!(
                "    meta l4proto icmp update @icmp_rate_limit_ipv4 {{ ip saddr limit rate 10/second }}"
            ));
            script.push(format!(
                "    meta l4proto ipv6-icmp update @icmp_rate_limit_ipv6 {{ ip6 saddr limit rate 10/second }}"
            ));
        }
        if chain.filter {
            for rule in filtertable.rules {
                if !rule.active {
                    continue;
                }
                let mut source_ipv4s: Vec<String> = vec![];
                let mut source_ipv6s: Vec<String> = vec![];
                for src in rule.source.iter() {
                    let ips = ipv4addresses_from_def(&config_items, src);
                    for ip in ips.iter() {
                        if !source_ipv4s.contains(ip) {
                            source_ipv4s.push(ip.clone());
                        }
                    }
                    let ips = ipv6addresses_from_def(&config_items, src);
                    for ip in ips.iter() {
                        if !source_ipv6s.contains(ip) {
                            source_ipv6s.push(ip.clone());
                        }
                    }
                }
                let mut dest_ipv4s: Vec<String> = vec![];
                let mut dest_ipv6s: Vec<String> = vec![];
                for dst in rule.destination.iter() {
                    let ips = ipv4addresses_from_def(&config_items, dst);
                    for ip in ips.iter() {
                        if !dest_ipv4s.contains(ip) {
                            dest_ipv4s.push(ip.clone());
                        }
                    }
                    let ips = ipv6addresses_from_def(&config_items, dst);
                    for ip in ips.iter() {
                        if !dest_ipv6s.contains(ip) {
                            dest_ipv6s.push(ip.clone());
                        }
                    }
                }
                let source_tcp_ports = tcp_ports_from_services(&config_items, &rule.sourceservice);
                let source_udp_ports = udp_ports_from_services(&config_items, &rule.sourceservice);
                let source_icmpv4_types = icmpv4_types_from_services(&rule.sourceservice);
                let source_icmpv6_types = icmpv6_types_from_services(&rule.sourceservice);
                let dest_tcp_ports =
                    tcp_ports_from_services(&config_items, &rule.destinationservice);
                let dest_udp_ports =
                    udp_ports_from_services(&config_items, &rule.destinationservice);
                let dest_icmpv4_types = icmpv4_types_from_services(&rule.destinationservice);
                let dest_icmpv6_types = icmpv6_types_from_services(&rule.destinationservice);

                let service_set = source_tcp_ports.len() > 0
                    || source_udp_ports.len() > 0
                    || source_icmpv4_types.len() > 0
                    || source_icmpv6_types.len() > 0
                    || dest_tcp_ports.len() > 0
                    || dest_udp_ports.len() > 0
                    || dest_icmpv4_types.len() > 0
                    || dest_icmpv6_types.len() > 0;

                // check valid ipv4
                if (source_ipv4s.len() > 0 && (dest_ipv4s.len() > 0 || dest_ipv6s.len() == 0))
                    || (dest_ipv4s.len() > 0 && (source_ipv4s.len() > 0 || source_ipv6s.len() == 0))
                    || ((source_ipv4s.len() == 0
                        && dest_ipv4s.len() == 0
                        && source_ipv6s.len() == 0
                        && dest_ipv6s.len() == 0)
                        && service_set)
                {
                    // check valid tcp
                    if (source_tcp_ports.len() > 0
                        && (dest_tcp_ports.len() > 0 || dest_udp_ports.len() == 0))
                        || (dest_tcp_ports.len() > 0
                            && (source_tcp_ports.len() > 0 || source_udp_ports.len() == 0))
                    {
                        // rule for ipv4 tcp
                        let mut line = String::from("    meta nfproto ipv4 ");
                        if source_ipv4s.len() > 0 {
                            line.push_str(&format!("ip saddr {{ {} }} ", source_ipv4s.join(", ")));
                        }
                        if dest_ipv4s.len() > 0 {
                            line.push_str(&format!("ip daddr {{ {} }} ", dest_ipv4s.join(", ")));
                        }
                        if source_tcp_ports.len() > 0 {
                            line.push_str(&format!(
                                "tcp sport {{ {} }} ",
                                source_tcp_ports.join(", ")
                            ));
                        }

                        if dest_tcp_ports.len() > 0 {
                            line.push_str(&format!(
                                "tcp dport {{ {} }} ",
                                dest_tcp_ports.join(", ")
                            ));
                        }

                        if rule.action == "drop" {
                            line.push_str(&format!(
                                " {}drop ",
                                &logcommand(
                                    &mut counters,
                                    &config_items.logging,
                                    &filtertable.chain,
                                    "tcp_ipv4",
                                )
                            ));
                        } else {
                            line.push_str(syn_limit_ipv4_txt);
                            line.push_str(&format!(" {} ", rule.action));
                        }
                        if rule.comment.len() > 0 {
                            line.push_str(&format!("# {}", rule.comment));
                        }
                        script.push(line);
                    }
                    // check valid udp
                    if (source_udp_ports.len() > 0
                        && (dest_udp_ports.len() > 0 || dest_tcp_ports.len() == 0))
                        || (dest_udp_ports.len() > 0
                            && (source_udp_ports.len() > 0 || source_tcp_ports.len() == 0))
                    {
                        // rule for ipv4 udp
                        let mut line = String::from("    meta nfproto ipv4 ");
                        if source_ipv4s.len() > 0 {
                            line.push_str(&format!("ip saddr {{ {} }} ", source_ipv4s.join(", ")));
                        }
                        if dest_ipv4s.len() > 0 {
                            line.push_str(&format!("ip daddr {{ {} }} ", dest_ipv4s.join(", ")));
                        }
                        if source_udp_ports.len() > 0 {
                            line.push_str(&format!(
                                "udp sport {{ {} }} ",
                                source_udp_ports.join(", ")
                            ));
                        }

                        if dest_udp_ports.len() > 0 {
                            line.push_str(&format!(
                                "udp dport {{ {} }} ",
                                dest_udp_ports.join(", ")
                            ));
                        }
                        if rule.action == "drop" {
                            line.push_str(&format!(
                                " {}drop ",
                                &logcommand(
                                    &mut counters,
                                    &config_items.logging,
                                    &filtertable.chain,
                                    "udp_ipv4",
                                )
                            ));
                        } else {
                            line.push_str(&format!(" {} ", rule.action));
                        }
                        if rule.comment.len() > 0 {
                            line.push_str(&format!("# {}", rule.comment));
                        }
                        script.push(line);
                    }
                    if config_items
                        .inactive_defaults
                        .contains(&String::from("ICMP"))
                    {
                        // check valid icmpv4
                        if source_icmpv4_types.len() > 0 || dest_icmpv4_types.len() > 0 {
                            // rule for icmpv4
                            let mut types: Vec<String> = vec![];
                            for t in source_icmpv4_types.iter() {
                                if !types.contains(t) {
                                    types.push(t.clone());
                                }
                            }
                            for t in dest_icmpv4_types.iter() {
                                if !types.contains(t) {
                                    types.push(t.clone());
                                }
                            }
                            let mut line = String::from("    meta nfproto ipv4 ");
                            if source_ipv4s.len() > 0 {
                                line.push_str(&format!(
                                    "ip saddr {{ {} }} ",
                                    source_ipv4s.join(", ")
                                ));
                            }
                            if dest_ipv4s.len() > 0 {
                                line.push_str(&format!(
                                    "ip daddr {{ {} }} ",
                                    dest_ipv4s.join(", ")
                                ));
                            }
                            if types.len() > 0 {
                                line.push_str(&format!("icmp code {{ {} }} ", types.join(", ")));
                            }
                            if rule.action == "drop" {
                                line.push_str(&format!(
                                    " {}drop ",
                                    &logcommand(
                                        &mut counters,
                                        &config_items.logging,
                                        &filtertable.chain,
                                        "icmpv4",
                                    )
                                ));
                            } else {
                                line.push_str(&format!(" {} ", rule.action));
                            }
                            if rule.comment.len() > 0 {
                                line.push_str(&format!("# {}", rule.comment));
                            }
                            script.push(line);
                        }
                    }
                }
                // check valid ipv6
                if (source_ipv6s.len() > 0 && (dest_ipv6s.len() > 0 || dest_ipv4s.len() == 0))
                    || (dest_ipv6s.len() > 0 && (source_ipv6s.len() > 0 || source_ipv4s.len() == 0))
                    || ((source_ipv6s.len() == 0
                        && dest_ipv6s.len() == 0
                        && source_ipv4s.len() == 0
                        && dest_ipv4s.len() == 0)
                        && service_set)
                {
                    // check valid tcp
                    if (source_tcp_ports.len() > 0
                        && (dest_tcp_ports.len() > 0 || dest_udp_ports.len() == 0))
                        || (dest_tcp_ports.len() > 0
                            && (source_tcp_ports.len() > 0 || source_udp_ports.len() == 0))
                    {
                        // rule for ipv6 tcp
                        let mut line = String::from("    meta nfproto ipv6 ");
                        if source_ipv6s.len() > 0 {
                            line.push_str(&format!("ip6 saddr {{ {} }} ", source_ipv6s.join(", ")));
                        }
                        if dest_ipv6s.len() > 0 {
                            line.push_str(&format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", ")));
                        }
                        if source_tcp_ports.len() > 0 {
                            line.push_str(&format!(
                                "tcp sport {{ {} }} ",
                                source_tcp_ports.join(", ")
                            ));
                        }

                        if dest_tcp_ports.len() > 0 {
                            line.push_str(&format!(
                                "tcp dport {{ {} }} ",
                                dest_tcp_ports.join(", ")
                            ));
                        }

                        if rule.action == "drop" {
                            line.push_str(&format!(
                                " {}drop ",
                                &logcommand(
                                    &mut counters,
                                    &config_items.logging,
                                    &filtertable.chain,
                                    "tcp_ipv6",
                                )
                            ));
                        } else {
                            line.push_str(syn_limit_ipv6_txt);
                            line.push_str(&format!(" {} ", rule.action));
                        }
                        if rule.comment.len() > 0 {
                            line.push_str(&format!("# {}", rule.comment));
                        }
                        script.push(line);
                    }
                    // check valid udp
                    if (source_udp_ports.len() > 0
                        && (dest_udp_ports.len() > 0 || dest_tcp_ports.len() == 0))
                        || (dest_udp_ports.len() > 0
                            && (source_udp_ports.len() > 0 || source_tcp_ports.len() == 0))
                    {
                        // rule for ipv6 udp
                        let mut line = String::from("    meta nfproto ipv6 ");
                        if source_ipv6s.len() > 0 {
                            line.push_str(&format!("ip6 saddr {{ {} }} ", source_ipv6s.join(", ")));
                        }
                        if dest_ipv6s.len() > 0 {
                            line.push_str(&format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", ")));
                        }
                        if source_udp_ports.len() > 0 {
                            line.push_str(&format!(
                                "udp sport {{ {} }} ",
                                source_udp_ports.join(", ")
                            ));
                        }

                        if dest_udp_ports.len() > 0 {
                            line.push_str(&format!(
                                "udp dport {{ {} }} ",
                                dest_udp_ports.join(", ")
                            ));
                        }
                        if rule.action == "drop" {
                            line.push_str(&format!(
                                " {}drop ",
                                &logcommand(
                                    &mut counters,
                                    &config_items.logging,
                                    &filtertable.chain,
                                    "udp_ipv6",
                                )
                            ));
                        } else {
                            line.push_str(&format!(" {} ", rule.action));
                        }
                        if rule.comment.len() > 0 {
                            line.push_str(&format!("# {}", rule.comment));
                        }
                        script.push(line);
                    }
                    if config_items
                        .inactive_defaults
                        .contains(&String::from("ICMP"))
                    {
                        // check valid icmpv6
                        if source_icmpv6_types.len() > 0 || dest_icmpv6_types.len() > 0 {
                            // rule for icmpv6
                            let mut types: Vec<String> = vec![];
                            for t in source_icmpv6_types.iter() {
                                if !types.contains(t) {
                                    types.push(t.clone());
                                }
                            }
                            for t in dest_icmpv6_types.iter() {
                                if !types.contains(t) {
                                    types.push(t.clone());
                                }
                            }
                            let mut line = String::from("    meta nfproto ipv6 ");
                            if source_ipv6s.len() > 0 {
                                line.push_str(&format!(
                                    "ip6 saddr {{ {} }} ",
                                    source_ipv6s.join(", ")
                                ));
                            }
                            if dest_ipv6s.len() > 0 {
                                line.push_str(&format!(
                                    "ip6 daddr {{ {} }} ",
                                    dest_ipv6s.join(", ")
                                ));
                            }
                            if types.len() > 0 {
                                line.push_str(&format!("icmpv6 code {{ {} }} ", types.join(", ")));
                            }
                            if rule.action == "drop" {
                                line.push_str(&format!(
                                    " {}drop ",
                                    &logcommand(
                                        &mut counters,
                                        &config_items.logging,
                                        &filtertable.chain,
                                        "icmpv6",
                                    )
                                ));
                            } else {
                                line.push_str(&format!(" {} ", rule.action));
                            }
                            if rule.comment.len() > 0 {
                                line.push_str(&format!("# {}", rule.comment));
                            }
                            script.push(line);
                        }
                    }
                }
            }
        }
        if filtertable.policy == "drop" {
            script.push(format!(
                "    {}drop ",
                &logcommand(
                    &mut counters,
                    &config_items.logging,
                    &filtertable.chain,
                    "default",
                )
            ));
        } else {
            script.push(format!("    {}", filtertable.policy));
        }
        script.push(String::from("  }"));
    }
    if config_items.logging == "counter" {
        script = addcounters(script, counters.clone());
    }

    for dir in ["input", "forward", "output"] {
        script.push(format!("  chain all_{} {{", dir));
        script.push(format!("    type filter hook {} priority filter;", dir));
        let filter_slice = &config_items.filters.filtertables[..];
        for filtertable in filter_slice.iter().cloned() {
            if filtertable.deleted {
                continue;
            }
            let chain = get_chain(&config_items, &filtertable.chain)?;
            if chain.direction == dir {
                match dir {
                    "input" => {
                        script.push(format!(
                            "    iifname {} jump {}",
                            get_interface(&config_items, &chain.iface_in)?,
                            &filtertable.chain
                        ));
                    }
                    "output" => {
                        script.push(format!(
                            "    oifname {} jump {}",
                            get_interface(&config_items, &chain.iface_out)?,
                            &filtertable.chain
                        ));
                    }
                    _ => {
                        // forward
                        script.push(format!(
                            "    iifname {} oifname {} jump {}",
                            get_interface(&config_items, &chain.iface_in)?,
                            get_interface(&config_items, &chain.iface_out)?,
                            &filtertable.chain
                        ));
                    }
                }
            }
        }
        script.push(String::from("  }"));
    }

    script.push(String::from("}"));
    script.push(String::from(""));

    script.push(String::from("# SNat rules"));
    script.push(String::from("table inet snat_inet {"));
    let snat_slice = &config_items.snat.nattables[..];
    for nattable in snat_slice.iter().cloned() {
        if nattable.deleted {
            continue;
        }

        let chain = get_chain(&config_items, &nattable.chain)?;
        if !chain.snat || nattable.rules.len() == 0 {
            continue;
        }
        let mut ifspec = String::from("");
        if chain.iface_in != "-" {
            ifspec = format!("iifname {} ", chain.iface_in);
        }
        if chain.iface_out != "-" {
            ifspec = format!("{} oifname {} ", ifspec, chain.iface_out);
        }
        script.push(format!("  chain {}_snat {{", nattable.chain));
        script.push(String::from(
            "    type nat hook postrouting priority srcnat",
        ));
        for rule in nattable.rules {
            if !rule.active {
                continue;
            }
            let mut source_ipv4s: Vec<String> = vec![];
            let mut source_ipv6s: Vec<String> = vec![];
            for src in rule.source.iter() {
                let ips = ipv4addresses_from_def(&config_items, src);
                for ip in ips.iter() {
                    if !source_ipv4s.contains(ip) {
                        source_ipv4s.push(ip.clone());
                    }
                }
                let ips = ipv6addresses_from_def(&config_items, src);
                for ip in ips.iter() {
                    if !source_ipv6s.contains(ip) {
                        source_ipv6s.push(ip.clone());
                    }
                }
            }
            let mut dest_ipv4s: Vec<String> = vec![];
            let mut dest_ipv6s: Vec<String> = vec![];
            for dst in rule.destination.iter() {
                let ips = ipv4addresses_from_def(&config_items, dst);
                for ip in ips.iter() {
                    if !dest_ipv4s.contains(ip) {
                        dest_ipv4s.push(ip.clone());
                    }
                }
                let ips = ipv6addresses_from_def(&config_items, dst);
                for ip in ips.iter() {
                    if !dest_ipv6s.contains(ip) {
                        dest_ipv6s.push(ip.clone());
                    }
                }
            }
            let mut trans_ipv4s: Vec<String> = vec![];
            let mut trans_ipv6s: Vec<String> = vec![];

            let ips = ipv4addresses_from_def(&config_items, &rule.translated);
            for ip in ips.iter() {
                if !trans_ipv4s.contains(ip) {
                    trans_ipv4s.push(ip.clone());
                }
            }
            let ips = ipv6addresses_from_def(&config_items, &rule.translated);
            for ip in ips.iter() {
                if !trans_ipv6s.contains(ip) {
                    trans_ipv6s.push(ip.clone());
                }
            }

            let source_tcp_ports = tcp_ports_from_services(&config_items, &rule.sourceservice);
            let source_udp_ports = udp_ports_from_services(&config_items, &rule.sourceservice);
            let dest_tcp_ports = tcp_ports_from_services(&config_items, &rule.destinationservice);
            let dest_udp_ports = udp_ports_from_services(&config_items, &rule.destinationservice);
            let trans_tcp_ports =
                tcp_ports_from_services(&config_items, &vec![rule.translatedservice.to_owned()]);
            let trans_udp_ports =
                udp_ports_from_services(&config_items, &vec![rule.translatedservice]);

            let service_set = source_tcp_ports.len() > 0
                || source_udp_ports.len() > 0
                || dest_tcp_ports.len() > 0
                || dest_udp_ports.len() > 0;

            // check valid ipv4
            if trans_ipv4s.len() == 1
                && (source_ipv4s.len() > 0 && (dest_ipv4s.len() > 0 || dest_ipv6s.len() == 0))
                || (dest_ipv4s.len() > 0 && (source_ipv4s.len() > 0 || source_ipv6s.len() == 0))
                || ((source_ipv4s.len() == 0
                    && dest_ipv4s.len() == 0
                    && source_ipv6s.len() == 0
                    && dest_ipv6s.len() == 0)
                    && service_set)
            {
                // check valid tcp
                if trans_tcp_ports.len() < 2
                    && (trans_tcp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_tcp_ports.len() > 0
                        && (dest_tcp_ports.len() > 0 || dest_udp_ports.len() == 0))
                        || (dest_tcp_ports.len() > 0
                            && (source_tcp_ports.len() > 0 || source_udp_ports.len() == 0)))
                {
                    // rule for ipv4 tcp
                    let mut line = String::from("    meta nfproto ipv4 ");
                    if source_ipv4s.len() > 0 {
                        line.push_str(&format!("ip saddr {{ {} }} ", source_ipv4s.join(", ")));
                    }
                    if dest_ipv4s.len() > 0 {
                        line.push_str(&format!("ip daddr {{ {} }} ", dest_ipv4s.join(", ")));
                    }
                    if source_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp sport {{ {} }} ", source_tcp_ports.join(", ")));
                    }
                    if dest_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp dport {{ {} }} ", dest_tcp_ports.join(", ")));
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &line,
                            &String::from(syn_limit_ipv4_txt),
                        );
                    }
                    line.push_str(&format!("{} snat to ", ifspec));
                    if trans_ipv4s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv4s[0]));
                    }
                    if trans_tcp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_tcp_ports[0]));
                    } else {
                        line.push_str(" ");
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
                // check valid udp
                if trans_udp_ports.len() < 2
                    && (trans_udp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_udp_ports.len() > 0
                        && (dest_udp_ports.len() > 0 || dest_tcp_ports.len() == 0))
                        || (dest_udp_ports.len() > 0
                            && (source_udp_ports.len() > 0 || source_tcp_ports.len() == 0)))
                {
                    // rule for ipv4 udp
                    let mut line = String::from("    meta nfproto ipv4 ");
                    if source_ipv4s.len() > 0 {
                        line.push_str(&format!("ip saddr {{ {} }} ", source_ipv4s.join(", ")));
                    }
                    if dest_ipv4s.len() > 0 {
                        line.push_str(&format!("ip daddr {{ {} }} ", dest_ipv4s.join(", ")));
                    }
                    if source_udp_ports.len() > 0 {
                        line.push_str(&format!("udp sport {{ {} }} ", source_udp_ports.join(", ")));
                    }

                    if dest_udp_ports.len() > 0 {
                        line.push_str(&format!("udp dport {{ {} }} ", dest_udp_ports.join(", ")));
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &line,
                            &String::from(""),
                        );
                    }
                    line.push_str(&format!("{} snat to ", ifspec));
                    if trans_ipv4s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv4s[0]));
                    }
                    if trans_udp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_udp_ports[0]));
                    } else {
                        line.push_str(" ");
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
            }
            // check valid ipv6
            if trans_ipv6s.len() == 1
                && (source_ipv6s.len() > 0 && (dest_ipv6s.len() > 0 || dest_ipv4s.len() == 0))
                || (dest_ipv6s.len() > 0 && (source_ipv6s.len() > 0 || source_ipv4s.len() == 0))
                || ((source_ipv6s.len() == 0
                    && dest_ipv6s.len() == 0
                    && source_ipv4s.len() == 0
                    && dest_ipv4s.len() == 0)
                    && service_set)
            {
                // check valid tcp
                if trans_tcp_ports.len() < 2
                    && (trans_tcp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_tcp_ports.len() > 0
                        && (dest_tcp_ports.len() > 0 || dest_udp_ports.len() == 0))
                        || (dest_tcp_ports.len() > 0
                            && (source_tcp_ports.len() > 0 || source_udp_ports.len() == 0)))
                {
                    // rule for ipv6 tcp
                    let mut line = String::from("    meta nfproto ipv6 ");
                    if source_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 saddr {{ {} }} ", source_ipv6s.join(", ")));
                    }
                    if dest_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", ")));
                    }
                    if source_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp sport {{ {} }} ", source_tcp_ports.join(", ")));
                    }

                    if dest_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp dport {{ {} }} ", dest_tcp_ports.join(", ")));
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &line,
                            &String::from(syn_limit_ipv6_txt),
                        );
                    }
                    line.push_str(&format!("{} snat to ", ifspec));
                    if trans_ipv6s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv6s[0]));
                    }
                    if trans_tcp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_tcp_ports[0]));
                    } else {
                        line.push_str(" ");
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
                // check valid udp
                if trans_udp_ports.len() < 2
                    && (trans_udp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_udp_ports.len() > 0
                        && (dest_udp_ports.len() > 0 || dest_tcp_ports.len() == 0))
                        || (dest_udp_ports.len() > 0
                            && (source_udp_ports.len() > 0 || source_tcp_ports.len() == 0)))
                {
                    // rule for ipv6 udp
                    let mut line = String::from("    meta nfproto ipv6 ");
                    if source_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 saddr {{ {} }} ", source_ipv6s.join(", ")));
                    }
                    if dest_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", ")));
                    }
                    if source_udp_ports.len() > 0 {
                        line.push_str(&format!("udp sport {{ {} }} ", source_udp_ports.join(", ")));
                    }

                    if dest_udp_ports.len() > 0 {
                        line.push_str(&format!("udp dport {{ {} }} ", dest_udp_ports.join(", ")));
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &line,
                            &String::from(""),
                        );
                    }
                    line.push_str(&format!("{} snat to ", ifspec));
                    if trans_ipv6s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv6s[0]));
                    }
                    if trans_udp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_udp_ports[0]));
                    } else {
                        line.push_str(" ");
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
            }
        }
        script.push(String::from("  }"));
    }

    script.push(String::from("}"));
    script.push(String::from(""));

    script.push(String::from("# DNat rules"));
    script.push(String::from("table inet dnat_inet {"));
    let dnat_slice = &config_items.dnat.nattables[..];
    for nattable in dnat_slice.iter().cloned() {
        if nattable.deleted {
            continue;
        }

        let chain = get_chain(&config_items, &nattable.chain)?;
        if !chain.dnat || nattable.rules.len() == 0 {
            continue;
        }
        let mut ifspec = String::from("");
        if chain.iface_in != "-" {
            ifspec = format!("iifname {} ", chain.iface_in);
        }
        if chain.iface_out != "-" {
            ifspec = format!("{} oifname {} ", ifspec, chain.iface_out);
        }
        script.push(format!("  chain {}_dnat {{", nattable.chain));
        script.push(String::from("    type nat hook prerouting priority dstnat"));
        for rule in nattable.rules {
            if !rule.active {
                continue;
            }
            let mut source_ipv4s: Vec<String> = vec![];
            let mut source_ipv6s: Vec<String> = vec![];
            for src in rule.source.iter() {
                let ips = ipv4addresses_from_def(&config_items, src);
                for ip in ips.iter() {
                    if !source_ipv4s.contains(ip) {
                        source_ipv4s.push(ip.clone());
                    }
                }
                let ips = ipv6addresses_from_def(&config_items, src);
                for ip in ips.iter() {
                    if !source_ipv6s.contains(ip) {
                        source_ipv6s.push(ip.clone());
                    }
                }
            }
            let mut dest_ipv4s: Vec<String> = vec![];
            let mut dest_ipv6s: Vec<String> = vec![];
            for dst in rule.destination.iter() {
                let ips = ipv4addresses_from_def(&config_items, dst);
                for ip in ips.iter() {
                    if !dest_ipv4s.contains(ip) {
                        dest_ipv4s.push(ip.clone());
                    }
                }
                let ips = ipv6addresses_from_def(&config_items, dst);
                for ip in ips.iter() {
                    if !dest_ipv6s.contains(ip) {
                        dest_ipv6s.push(ip.clone());
                    }
                }
            }
            let mut trans_ipv4s: Vec<String> = vec![];
            let mut trans_ipv6s: Vec<String> = vec![];

            let ips = ipv4addresses_from_def(&config_items, &rule.translated);
            for ip in ips.iter() {
                if !trans_ipv4s.contains(ip) {
                    trans_ipv4s.push(ip.clone());
                }
            }
            let ips = ipv6addresses_from_def(&config_items, &rule.translated);
            for ip in ips.iter() {
                if !trans_ipv6s.contains(ip) {
                    trans_ipv6s.push(ip.clone());
                }
            }

            let source_tcp_ports = tcp_ports_from_services(&config_items, &rule.sourceservice);
            let source_udp_ports = udp_ports_from_services(&config_items, &rule.sourceservice);
            let dest_tcp_ports = tcp_ports_from_services(&config_items, &rule.destinationservice);
            let dest_udp_ports = udp_ports_from_services(&config_items, &rule.destinationservice);
            let trans_tcp_ports =
                tcp_ports_from_services(&config_items, &vec![rule.translatedservice.to_owned()]);
            let trans_udp_ports =
                udp_ports_from_services(&config_items, &vec![rule.translatedservice]);

            let service_set = source_tcp_ports.len() > 0
                || source_udp_ports.len() > 0
                || dest_tcp_ports.len() > 0
                || dest_udp_ports.len() > 0;

            // check valid ipv4
            if trans_ipv4s.len() == 1
                && (source_ipv4s.len() > 0 && (dest_ipv4s.len() > 0 || dest_ipv6s.len() == 0))
                || (dest_ipv4s.len() > 0 && (source_ipv4s.len() > 0 || source_ipv6s.len() == 0))
                || ((source_ipv4s.len() == 0
                    && dest_ipv4s.len() == 0
                    && source_ipv6s.len() == 0
                    && dest_ipv6s.len() == 0)
                    && service_set)
            {
                // check valid tcp
                if trans_tcp_ports.len() < 2
                    && (trans_tcp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_tcp_ports.len() > 0
                        && (dest_tcp_ports.len() > 0 || dest_udp_ports.len() == 0))
                        || (dest_tcp_ports.len() > 0
                            && (source_tcp_ports.len() > 0 || source_udp_ports.len() == 0)))
                {
                    // rule for ipv4 tcp
                    let mut line = String::from("    meta nfproto ipv4 ");
                    if source_ipv4s.len() > 0 {
                        line.push_str(&format!("ip saddr {{ {} }} ", source_ipv4s.join(", ")));
                    }
                    let linestart = line.clone();
                    let mut dest_addr = String::from("");
                    let mut src_ports = String::from("");
                    let mut dest_ports = String::from("");
                    if dest_ipv4s.len() > 0 {
                        line.push_str(&format!("ip daddr {{ {} }} ", dest_ipv4s.join(", ")));
                        dest_addr = format!("ip daddr {{ {} }} ", dest_ipv4s.join(", "));
                    }
                    if source_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp sport {{ {} }} ", source_tcp_ports.join(", ")));
                        src_ports = format!("tcp sport {{ {} }} ", source_tcp_ports.join(", "));
                    }

                    if dest_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp dport {{ {} }} ", dest_tcp_ports.join(", ")));
                        dest_ports = format!("tcp dport {{ {} }} ", dest_tcp_ports.join(", "));
                    }
                    line.push_str(&format!("{} dnat to ", ifspec));
                    if trans_ipv4s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv4s[0]));
                        dest_addr = format!("ip daddr {} ", trans_ipv4s[0]);
                    }
                    if trans_tcp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_tcp_ports[0]));
                        dest_ports = format!("tcp dport {} ", trans_tcp_ports[0]);
                    } else {
                        line.push_str(" ");
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        let filterline: String =
                            format!("{}{}{}{}", linestart, dest_addr, src_ports, dest_ports);
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &filterline,
                            &String::from(syn_limit_ipv4_txt),
                        );
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
                // check valid udp
                if trans_udp_ports.len() < 2
                    && (trans_udp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_udp_ports.len() > 0
                        && (dest_udp_ports.len() > 0 || dest_tcp_ports.len() == 0))
                        || (dest_udp_ports.len() > 0
                            && (source_udp_ports.len() > 0 || source_tcp_ports.len() == 0)))
                {
                    // rule for ipv4 udp
                    let mut line = String::from("    meta nfproto ipv4 ");
                    if source_ipv4s.len() > 0 {
                        line.push_str(&format!("ip saddr {{ {} }} ", source_ipv4s.join(", ")));
                    }
                    let linestart = line.clone();
                    let mut dest_addr = String::from("");
                    let mut src_ports = String::from("");
                    let mut dest_ports = String::from("");
                    if dest_ipv4s.len() > 0 {
                        line.push_str(&format!("ip daddr {{ {} }} ", dest_ipv4s.join(", ")));
                        dest_addr = format!("ip daddr {{ {} }} ", dest_ipv4s.join(", "));
                    }
                    if source_udp_ports.len() > 0 {
                        line.push_str(&format!("udp sport {{ {} }} ", source_udp_ports.join(", ")));
                        src_ports = format!("udp sport {{ {} }} ", source_udp_ports.join(", "));
                    }

                    if dest_udp_ports.len() > 0 {
                        line.push_str(&format!("udp dport {{ {} }} ", dest_udp_ports.join(", ")));
                        dest_ports = format!("udp dport {{ {} }} ", dest_udp_ports.join(", "));
                    }
                    line.push_str(&format!("{} dnat to ", ifspec));
                    if trans_ipv4s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv4s[0]));
                        dest_addr = format!("ip daddr {} ", trans_ipv4s[0]);
                    }
                    if trans_udp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_udp_ports[0]));
                        dest_ports = format!("udp dport {} ", trans_udp_ports[0]);
                    } else {
                        line.push_str(" ");
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        let filterline: String =
                            format!("{}{}{}{}", linestart, dest_addr, src_ports, dest_ports);
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &filterline,
                            &String::from(""),
                        );
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
            }
            // check valid ipv6
            if trans_ipv6s.len() == 1
                && (source_ipv6s.len() > 0 && (dest_ipv6s.len() > 0 || dest_ipv4s.len() == 0))
                || (dest_ipv6s.len() > 0 && (source_ipv6s.len() > 0 || source_ipv4s.len() == 0))
                || ((source_ipv6s.len() == 0
                    && dest_ipv6s.len() == 0
                    && source_ipv4s.len() == 0
                    && dest_ipv4s.len() == 0)
                    && service_set)
            {
                // check valid tcp
                if trans_tcp_ports.len() < 2
                    && (trans_tcp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_tcp_ports.len() > 0
                        && (dest_tcp_ports.len() > 0 || dest_udp_ports.len() == 0))
                        || (dest_tcp_ports.len() > 0
                            && (source_tcp_ports.len() > 0 || source_udp_ports.len() == 0)))
                {
                    // rule for ipv6 tcp
                    let mut line = String::from("    meta nfproto ipv6 ");
                    if source_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 saddr {{ {} }} ", source_ipv6s.join(", ")));
                    }
                    let linestart = line.clone();
                    let mut dest_addr = String::from("");
                    let mut src_ports = String::from("");
                    let mut dest_ports = String::from("");
                    if dest_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", ")));
                        dest_addr = format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", "));
                    }
                    if source_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp sport {{ {} }} ", source_tcp_ports.join(", ")));
                        src_ports = format!("tcp sport {{ {} }} ", source_tcp_ports.join(", "));
                    }

                    if dest_tcp_ports.len() > 0 {
                        line.push_str(&format!("tcp dport {{ {} }} ", dest_tcp_ports.join(", ")));
                        dest_ports = format!("tcp dport {{ {} }} ", dest_tcp_ports.join(", "));
                    }
                    line.push_str(&format!("{} dnat to ", ifspec));
                    if trans_ipv6s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv6s[0]));
                        dest_addr = format!("ip6 daddr {} ", trans_ipv6s[0]);
                    }
                    if trans_tcp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_tcp_ports[0]));
                        dest_ports = format!("tcp dport {} ", trans_tcp_ports[0]);
                    } else {
                        line.push_str(" ");
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        let filterline: String =
                            format!("{}{}{}{}", linestart, dest_addr, src_ports, dest_ports);
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &filterline,
                            &String::from(syn_limit_ipv6_txt),
                        );
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
                // check valid udp
                if trans_udp_ports.len() < 2
                    && (trans_udp_ports.len() == 1
                        || (trans_udp_ports.len() == 0 && trans_tcp_ports.len() == 0))
                    && ((source_udp_ports.len() > 0
                        && (dest_udp_ports.len() > 0 || dest_tcp_ports.len() == 0))
                        || (dest_udp_ports.len() > 0
                            && (source_udp_ports.len() > 0 || source_tcp_ports.len() == 0)))
                {
                    // rule for ipv6 udp
                    let mut line = String::from("    meta nfproto ipv6 ");
                    if source_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 saddr {{ {} }} ", source_ipv6s.join(", ")));
                    }
                    let linestart = line.clone();
                    let mut dest_addr = String::from("");
                    let mut src_ports = String::from("");
                    let mut dest_ports = String::from("");
                    if dest_ipv6s.len() > 0 {
                        line.push_str(&format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", ")));
                        dest_addr = format!("ip6 daddr {{ {} }} ", dest_ipv6s.join(", "));
                    }
                    if source_udp_ports.len() > 0 {
                        line.push_str(&format!("udp sport {{ {} }} ", source_udp_ports.join(", ")));
                        src_ports = format!("udp sport {{ {} }} ", source_udp_ports.join(", "));
                    }

                    if dest_udp_ports.len() > 0 {
                        line.push_str(&format!("udp dport {{ {} }} ", dest_udp_ports.join(", ")));
                        dest_ports = format!("udp dport {{ {} }} ", dest_udp_ports.join(", "));
                    }
                    line.push_str(&format!("{} dnat to ", ifspec));
                    if trans_ipv6s.len() == 1 {
                        line.push_str(&format!("{}", trans_ipv6s[0]));
                        dest_addr = format!("ip6 daddr {} ", trans_ipv6s[0]);
                    }
                    if trans_udp_ports.len() == 1 {
                        line.push_str(&format!(":{} ", trans_udp_ports[0]));
                        dest_ports = format!("udp dport {} ", trans_udp_ports[0]);
                    } else {
                        line.push_str(" ");
                    }
                    if !config_items
                        .inactive_defaults
                        .contains(&String::from("AllowNAT"))
                    {
                        let filterline: String =
                            format!("{}{}{}{}", linestart, dest_addr, src_ports, dest_ports);
                        script = add_natrule_to_filter(
                            script,
                            &nattable.chain,
                            &filterline,
                            &String::from(""),
                        );
                    }
                    if rule.comment.len() > 0 {
                        line.push_str(&format!("# {}", rule.comment));
                    }
                    script.push(line);
                }
            }
        }
        script.push(String::from("  }"));
    }

    script.push(String::from("}"));
    script.push(String::from(""));
    script.push(String::from("# Netdev rules"));
    script.push(String::from("table netdev filter_netdev {"));
    if config_items.logging == "counter" {
        script.push(String::from("  # Counter"));
        script.push(format!("  counter counter_netdev_invalid_tcp {{"));
        script.push(format!("  }}"));
    }
    config_items.interfaces.iter().for_each(|(_name, data)| {
        script.push(String::from("  chain ingress {"));
        script.push(format!(
            "    type filter hook ingress device {} priority -500;",
            data.systemname
        ));
        if !config_items
            .inactive_defaults
            .contains(&String::from("InvalidTCPFlags"))
        {
            script.push(String::from("    # Invalid TCP flags"));
            let invalid: [String; 10] = [
                format!(
                    "    tcp flags & (fin|psh|urg) == fin|psh|urg {}drop",
                    netdev_logcommand(&config_items.logging)
                ), // XMAS
                format!(
                    "    tcp flags & (syn|urg|ack|fin|rst) == 0 {}drop",
                    netdev_logcommand(&config_items.logging)
                ), // Null
                format!(
                    "    tcp flags & (fin|rst) == fin|rst {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (syn|rst) == syn|rst {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (syn|fin) == syn|fin {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (rst|urg) == rst|urg {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (syn|urg|ack|fin|rst) == fin {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (syn|urg|ack|fin|rst) == urg {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (syn|urg|ack|fin|rst) == fin|urg {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
                format!(
                    "    tcp flags & (syn|urg|ack|fin|rst) == syn|urg|ack {}drop",
                    netdev_logcommand(&config_items.logging)
                ),
            ];
            for i in invalid {
                script.push(i);
            }
        }
        if !config_items
            .inactive_defaults
            .contains(&String::from("TCPMSS"))
        {
            script.push(String::from("    # Invalid mss"));
            script.push(String::from(format!(
                "    tcp flags syn tcp option maxseg size 1-525 {}drop",
                netdev_logcommand(&config_items.logging).as_str()
            )));
        }
        script.push(String::from("  }"));
    });
    script.push(String::from("}"));
    config_items
        .post
        .lines()
        .for_each(|l| script.push(String::from(l)));
    return Ok(script);
}

fn modified_cmp(a: &walkdir::DirEntry, b: &walkdir::DirEntry) -> cmp::Ordering {
    if let (Ok(a_meta), Ok(b_meta)) = (a.metadata(), b.metadata()) {
        if let (Ok(a_modified), Ok(b_modified)) = (a_meta.modified(), b_meta.modified()) {
            return b_modified.cmp(&a_modified);
        }
    }
    return cmp::Ordering::Equal;
}

async fn lookup_host_addr(Path(hostname): Path<String>) -> Result<Json<Addrs>, StatusCode> {
    let lookup_result = lookup_host(format!("{hostname}:0")).await;
    //unwrap().collect::<Vec<_>>();
    let mut ipv4s: Vec<String> = vec![];
    let mut ipv6s: Vec<String> = vec![];
    //let path = env::current_exe();
    match lookup_result {
        Ok(ips) => {
            for ip in ips {
                if ip.is_ipv4() {
                    ipv4s.push(ip.to_string().trim_end_matches(":0").to_string());
                }
                if ip.is_ipv6() {
                    ipv6s.push(
                        ip.to_string()
                            .trim_start_matches("[")
                            .trim_end_matches("]:0")
                            .to_string(),
                    );
                }
            }
            return Ok(Json(Addrs {
                host: hostname,
                ipv4: ipv4s.join(" "),
                ipv6: ipv6s.join(" "),
            }));
        }
        Err(e) => {
            println!("lookup error {}", e.to_string())
        }
    }
    Err(StatusCode::INTERNAL_SERVER_ERROR)
}

async fn get_configuration_names(
    session: Session,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let mut output: Vec<String> = vec![];
    if !check_session(session, &state).await {
        return Err(StatusCode::UNAUTHORIZED);
    }
    let settings = state.settings.lock().await;
    let path = PathBuf::from(settings.paths.savepath.clone());

    if path.exists() {
        let wd = WalkDir::new(path).sort_by(modified_cmp).max_depth(1);
        for entry in wd {
            match entry {
                Ok(e) => {
                    if e.file_type().is_file() {
                        if let Some(name) = e.file_name().to_str() {
                            output.push(String::from(name));
                        }
                    }
                }
                Err(_e) => {}
            }
        }
        return Ok(Json(output));
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}

async fn users(State(state): State<Arc<AppState>>) -> Result<Json<Vec<String>>, StatusCode> {
    let mut users: Vec<String> = vec![];
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push("users");
    if path.exists() {
        let dir_result = path.read_dir();
        match dir_result {
            Ok(mut dir) => {
                while let Some(entry) = dir.next() {
                    if let Ok(e) = entry {
                        if e.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
                            if let Ok(fname) = e.file_name().into_string() {
                                if let Ok(name) = hex::decode(fname) {
                                    if let Ok(n) = String::from_utf8(name) {
                                        users.push(n);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(_e) => {}
        }
    }
    return Ok(Json(users));
}

async fn userexists(State(state): State<Arc<AppState>>) -> String {
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push("users");
    if path.exists() {
        let dir_result = path.read_dir();
        match dir_result {
            Ok(dir) => {
                if dir.count() > 0 {
                    return String::from("OK");
                }
            }
            Err(_e) => {}
        }
    }
    return String::from("NOK");
}

async fn deleteuser(
    Path(user): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Result<Json<Vec<String>>, StatusCode> {
    let mut users: Vec<String> = vec![];
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push("users");
    if path.exists() {
        path.push(hex::encode(user.as_bytes()));
        let _ = fs::remove_file(path.clone()).await;
        path.pop();
        let dir_result = path.read_dir();
        match dir_result {
            Ok(mut dir) => {
                while let Some(entry) = dir.next() {
                    if let Ok(e) = entry {
                        if e.file_type().map(|ft| ft.is_file()).unwrap_or(false) {
                            if let Ok(fname) = e.file_name().into_string() {
                                if let Ok(name) = hex::decode(fname) {
                                    if let Ok(n) = String::from_utf8(name) {
                                        users.push(n);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Err(_e) => {}
        }
    }
    return Ok(Json(users));
}

async fn get_network_interfaces() -> Result<Json<Vec<NwInterface>>, StatusCode> {
    //sleep(stdtime::Duration::from_secs(10));
    let network_interfaces = NetworkInterface::show();
    let mut output: Vec<NwInterface> = vec![];
    if let Ok(interfaces) = network_interfaces {
        for itf in interfaces.iter() {
            //let mut addr = String::from("");
            let mut string_list: Vec<String> = vec![];
            for a in itf.addr.iter() {
                // addr.push_str(" ");
                //addr.push_str(&(a.ip().to_string()));
                string_list.push(a.ip().to_string());
            }
            output.push(NwInterface {
                name: itf.name.clone(),
                addresses: string_list.join(" "),
            });
        }
        return Ok(Json(output));
    }

    Err(StatusCode::INTERNAL_SERVER_ERROR)
}

async fn delete_config(Path(config): Path<String>, State(state): State<Arc<AppState>>) -> String {
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push(config);
    let result = fs::remove_file(path).await;
    match result {
        Ok(()) => return String::from("OK"),
        Err(_e) => return String::from("Could not delete configurations file"),
    }
}

async fn new_totp_secret(
    State(_state): State<Arc<AppState>>,
) -> Result<Json<TotpSecret>, StatusCode> {
    // Generate an encoded secret
    let mut secret = generate_secret(80);

    // The data_encoding crate is re-exported for convenience
    let encoded = encode(&secret, data_encoding::BASE32);

    let uri_result = otp_uri(
        "totp",
        encoded.as_str(),
        "nftables builder user",
        "nftables builder",
        None,
    );
    let mut svg = String::from("");
    match uri_result {
        Ok(uri) => {
            let qr_code_result = generate_code_svg(&uri, None, None, EcLevel::M);
            match qr_code_result {
                Ok(qr) => svg = qr,
                Err(_e) => {
                    secret = vec![];
                }
            }
        }
        Err(_e) => {
            secret = vec![];
        }
    }
    Ok(Json(TotpSecret {
        secret: hex::encode(secret),
        svg: svg,
    }))
}

async fn load_config(
    Path(config): Path<String>,
    State(state): State<Arc<AppState>>,
) -> Json<Configuration> {
    let mut conf = Configuration {
        name: String::from(""),
        json: "".to_string(),
    };
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());

    path.push(config.clone());
    let result = fs::read_to_string(path).await;
    match result {
        Ok(b) => {
            conf.json = b;
            conf.name = config.clone()
        }
        Err(_e) => conf.json = String::from("Could not read configurations file"),
    }

    return axum::Json(conf);
}

async fn save_configuration(
    State(state): State<Arc<AppState>>,
    extract::Json(payload): extract::Json<Configuration>,
) -> String {
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push(payload.name);
    let result = fs::write(path.clone(), payload.json).await;
    match result {
        Ok(()) => return String::from("OK"),
        Err(_e) => return format!("Could not write configuration file {}", path.display()),
    }
}

async fn logout(State(state): State<Arc<AppState>>) -> String {
    let mut current_id = state.current_session.lock().await;
    if let Some(_cid) = *current_id {
        let no_id = state.no_session.lock().await;
        if let Some(_nid) = *no_id {
            *current_id = *no_id;
            return "OK".to_string();
        }
    }
    return "NOK".to_string();
}

async fn ids(session: Session, State(state): State<Arc<AppState>>) -> String {
    let current_id = state.current_session.lock().await;
    let no_id = state.no_session.lock().await;
    let session_id = session.id();
    let mut id_str = String::from("");
    match *current_id {
        None => {}
        Some(id) => id_str = id.to_string(),
    }
    let mut noid_str = String::from("");
    match *no_id {
        None => {}
        Some(noid) => noid_str = noid.to_string(),
    }
    let mut sessid_str = String::from("");
    match session_id {
        None => {}
        Some(sessid) => sessid_str = sessid.to_string(),
    }

    return format!("curr: {} def {} sess {}", id_str, noid_str, sessid_str);
}

async fn login(
    session: Session,
    State(state): State<Arc<AppState>>,
    extract::Json(payload): extract::Json<LoginData>,
) -> String {
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push("users");
    if !path.exists() {
        return String::from("No users configured");
    }
    path.push(hex::encode(payload.username.as_bytes()));
    if !path.exists() {
        return String::from("Invalid credentials");
    }
    let content_result = fs::read_to_string(path.clone()).await;
    match content_result {
        Err(_e) => return format!("Could not read user file {}", path.display()),
        Ok(content) => {
            let mut lines = content.lines();
            let passhash_hex = match lines.next() {
                Some(l) => l,
                None => return String::from("User file corrupt"),
            };
            let secret_hex = match lines.next() {
                Some(l) => l,
                None => return String::from("User file corrupt"),
            };
            let passhash_bytes = match hex::decode(passhash_hex) {
                Ok(b) => b,
                Err(_e) => return String::from("User file corrupt"),
            };
            let passhash = match String::from_utf8(passhash_bytes) {
                Ok(s) => s,
                Err(_e) => return String::from("User file corrupt"),
            };
            let secret_bytes = match hex::decode(secret_hex) {
                Ok(b) => b,
                Err(_e) => return String::from("User file corrupt"),
            };
            let parsed_hash = match PasswordHash::new(&passhash) {
                Ok(ph) => ph,
                Err(_e) => return String::from("User file corrupt"),
            };
            let password = payload.password.as_bytes();
            let verify_result = Argon2::default().verify_password(password, &parsed_hash);
            match verify_result {
                Err(_e) => return String::from("Invalid credentials"),
                Ok(()) => {
                    // password correct, check totp
                    let (result, discrepancy) =
                        verify_totp(&payload.mfa, &secret_bytes, 0).unwrap();
                    if result {
                        // correct credentials
                        let mut current_id = state.current_session.lock().await;
                        let no_id = state.no_session.lock().await;

                        match *current_id {
                            None => {}
                            Some(_id) => match *no_id {
                                None => {}
                                Some(_noid) => {
                                    if *current_id != *no_id {
                                        return String::from("Another session is active");
                                    }
                                    session.insert("dummy", 1).await.unwrap();
                                    session.save().await.unwrap();
                                    *current_id = session.id();

                                    return String::from("OK");
                                }
                            },
                        }
                    } else {
                        if discrepancy != 0 {
                            return format!("Time discrepancy too high: {}", discrepancy);
                        } else {
                            return String::from("Invalid credentials");
                        }
                    }
                }
            }
        }
    }
    return String::from("Internal error");
}

async fn add_user(
    State(state): State<Arc<AppState>>,
    extract::Json(payload): extract::Json<User>,
) -> String {
    let settings = state.settings.lock().await;
    let mut path = PathBuf::from(settings.paths.savepath.clone());
    path.push("users");
    if !path.exists() {
        let _r = fs::create_dir_all(path.clone()).await;
    }
    path.push(hex::encode(payload.username.as_bytes()));
    if path.exists() {
        return String::from("User already exists");
    }

    let password = payload.password.as_bytes();
    let salt = SaltString::generate(&mut OsRng);

    // Argon2 with default params (Argon2id v19)
    let argon2 = Argon2::default();

    // Hash password to PHC string ($argon2id$v=19$...)
    let password_hash_result = argon2.hash_password(password, &salt);
    match password_hash_result {
        Ok(phc) => {
            let password_hash = phc.to_string();
            let hex = hex::encode(password_hash.as_bytes());
            //let hex2 = hex::encode(payload.secret.as_bytes());
            let lines = format!("{}\n{}", hex, payload.secret);
            let result = fs::write(path.clone(), lines).await;
            match result {
                Ok(()) => return String::from("OK"),
                Err(_e) => return format!("Could not write user file {}", path.display()),
            }
        }
        Err(e) => {
            return format!("Password hashing error: {}", e.to_string());
        }
    }
}

async fn install_configuration(
    State(state): State<Arc<AppState>>,
    extract::Json(payload): extract::Json<Configuration>,
) -> String {
    #[derive(Serialize, Deserialize)]
    struct Output {
        result: Vec<String>,
        script: Vec<String>,
    }
    let settings = state.settings.lock().await;
    let script = generate_script(payload.json, settings.files.nft.clone());

    let testpath = PathBuf::from(settings.files.test.clone());
    fs::write(testpath, script.clone().unwrap().join("\n"))
        .await
        .unwrap();

    // Tell main process to test and install script
    let cipher = state.cipher.lock().await;
    let key = state.key.lock().await;
    let iv = state.iv.lock().await;
    let mut reader = state.reader.lock().await;
    let text = String::from("install");
    let data = text.as_bytes();

    let encrypted = encrypt(*cipher, &(*key), Some(&(*iv)), data).unwrap();

    let hex = hex::encode(encrypted);
    let mut stdout = tokio::io::stdout();
    let textn = format!("{}\n", hex);
    stdout.write_all(textn.as_bytes()).await.unwrap();
    stdout.flush().await.unwrap();

    // read response from main process
    let mut response = String::new();
    let _fut = (*reader).read_line(&mut response).await;
    let decoded = String::from_utf8(hex::decode(response.trim()).unwrap()).unwrap();
    let mut resvec: Vec<String> = vec![];
    for line in decoded.split("\n") {
        resvec.push(String::from(line));
    }

    let output: Output = Output {
        result: resvec,
        script: script.clone().unwrap(),
    };
    // Serialize it to a JSON string.
    let outstr = serde_json::to_string(&output).unwrap();
    return outstr;
}

async fn check_session(session: Session, state: &Arc<AppState>) -> bool {
    let current_id = state.current_session.lock().await;
    match *current_id {
        Some(_i) => return *current_id == session.id(),
        _ => {}
    }
    return false;
}

#[tokio::main]
async fn main() {
    // read key and iv from stdin
    let mut reader = tokio::io::BufReader::new(tokio::io::stdin());
    let mut keyline = String::new();
    let mut ivline = String::new();
    let read_key_result = reader.read_line(&mut keyline).await;
    match read_key_result {
        Err(err) => {
            println!("Could not read key: {}", err.to_string());
            return;
        }
        _ => {}
    }

    let read_iv_result = reader.read_line(&mut ivline).await;
    match read_iv_result {
        Err(err) => {
            println!("Could not read iv: {}", err.to_string());
            return;
        }
        _ => {}
    }

    let key_bytes = hex::decode(keyline.trim()).expect("Hex decoding failed");
    let iv_bytes = hex::decode(ivline.trim()).expect("Hex decoding failed");
    if key_bytes.len() != 32 || iv_bytes.len() != 32 {
        println!(
            "Invalid key (len {}) or iv (len {})",
            keyline.len(),
            ivline.len()
        );
        return;
    }
    let settings = get_settings();
    let no_session = Id::default();
    let shared_state = Arc::new(AppState {
        current_session: Mutex::new(Some(no_session)),
        no_session: Mutex::new(Some(no_session)),
        reader: Mutex::new(reader),
        cipher: Mutex::new(Cipher::aes_256_cbc()),
        key: Mutex::new(key_bytes),
        iv: Mutex::new(iv_bytes),
        settings: Mutex::new(settings.clone()),
    });
    println!("OK");

    let session_store = MemoryStore::default();
    let session_layer = SessionManagerLayer::new(session_store)
        .with_secure(false)
        .with_expiry(Expiry::OnInactivity(Duration::minutes(10)));

    let static_router = Router::new()
        .nest_service(
            "/assets",
            ServeDir::new(format!("{}/{}", settings.paths.htmlpath, "assets")),
        )
        .nest_service(
            "/img",
            ServeDir::new(format!("{}/{}", settings.paths.htmlpath, "img")),
        )
        .fallback_service(ServeFile::new(format!(
            "{}/{}",
            settings.paths.htmlpath, "index.html"
        )));
    let app = Router::new()
        .route("/lookup/{hostname}", get(lookup_host_addr))
        .route("/load/{config}", get(load_config))
        .route("/delete/{config}", get(delete_config))
        .route("/logout", get(logout))
        .route("/ids", get(ids))
        .route("/interfaces", get(get_network_interfaces))
        .route("/configs", get(get_configuration_names))
        .route("/newtotpsecret", get(new_totp_secret))
        .route("/save", post(save_configuration))
        .route("/adduser", post(add_user))
        .route("/deleteuser/{user}", get(deleteuser))
        .route("/users", get(users))
        .route("/userexists", get(userexists))
        .route("/login", post(login))
        .route("/install", post(install_configuration))
        .merge(static_router)
        .layer(session_layer)
        .with_state(shared_state);

    let addr = SocketAddr::from(([0, 0, 0, 0], settings.connection.port));

    // configure certificate and private key used by https
    let config = RustlsConfig::from_pem_file(
        PathBuf::from(settings.files.tlscert.clone()),
        PathBuf::from(settings.files.tlskey.clone()),
    )
    .await
    .unwrap();

    // run https server
    axum_server::bind_rustls(addr, config)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
