import pytest


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "RedLab"


def test_create_and_get_lab(client):
    payload = {
        "name": "Network Attack Lab",
        "description": "Simulated enterprise network attack environment",
        "graph_data": {
            "nodes": [
                {
                    "id": "fw-1",
                    "type": "firewall",
                    "position": {"x": 50, "y": 50},
                    "label": "Border Firewall",
                    "config": {"default_inbound_action": "deny"},
                }
            ],
            "edges": [],
        },
    }
    # Create lab
    res = client.post("/api/labs", json=payload)
    assert res.status_code == 201
    created = res.json()
    lab_id = created["id"]
    assert created["name"] == "Network Attack Lab"
    assert created["node_count"] == 1

    # Get lab
    res_get = client.get(f"/api/labs/{lab_id}")
    assert res_get.status_code == 200
    assert res_get.json()["id"] == lab_id
    assert res_get.json()["graph_data"]["nodes"][0]["label"] == "Border Firewall"


def test_list_labs(client):
    client.post("/api/labs", json={"name": "Lab A", "description": ""})
    client.post("/api/labs", json={"name": "Lab B", "description": ""})

    res = client.get("/api/labs")
    assert res.status_code == 200
    labs = res.json()
    assert len(labs) >= 2
    names = [l["name"] for l in labs]
    assert "Lab A" in names
    assert "Lab B" in names


def test_update_lab(client):
    res = client.post("/api/labs", json={"name": "Initial Name", "description": "v1"})
    lab_id = res.json()["id"]

    update_payload = {
        "name": "Updated Name",
        "description": "v2",
        "graph_data": {
            "nodes": [
                {
                    "id": "srv-1",
                    "type": "server",
                    "position": {"x": 100, "y": 100},
                    "label": "DMZ Web Server",
                    "config": {
                        "ip_address": "10.0.0.10",
                        "cidr_prefix": "24",
                        "default_gateway": "10.0.0.1",
                        "services": [{"name": "HTTPS", "port": 443, "protocol": "tcp", "enabled": True}],
                    },
                }
            ],
            "edges": [],
        },
    }
    res_up = client.put(f"/api/labs/{lab_id}", json=update_payload)
    assert res_up.status_code == 200
    data = res_up.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "v2"
    assert data["node_count"] == 1


def test_delete_lab(client):
    res = client.post("/api/labs", json={"name": "To Delete"})
    lab_id = res.json()["id"]

    res_del = client.delete(f"/api/labs/{lab_id}")
    assert res_del.status_code == 204

    # Verify 404 on get
    res_get = client.get(f"/api/labs/{lab_id}")
    assert res_get.status_code == 404


def test_nonexistent_lab_operations(client):
    fake_id = "00000000-0000-0000-0000-000000000000"
    assert client.get(f"/api/labs/{fake_id}").status_code == 404
    assert client.put(f"/api/labs/{fake_id}", json={"name": "X"}).status_code == 404
    assert client.delete(f"/api/labs/{fake_id}").status_code == 404
    assert client.post(f"/api/labs/{fake_id}/scan").status_code == 404
    assert client.get(f"/api/labs/{fake_id}/scans").status_code == 404
    assert client.get(f"/api/labs/{fake_id}/export").status_code == 404


def test_validation_error_on_empty_name(client):
    res = client.post("/api/labs", json={"name": ""})
    assert res.status_code == 422


def test_export_and_import_lab(client):
    # Create source lab
    payload = {
        "name": "Exportable Network Lab",
        "description": "Ready for backup",
        "graph_data": {
            "nodes": [
                {
                    "id": "sw-100",
                    "type": "switch",
                    "position": {"x": 0, "y": 0},
                    "label": "Core Switch",
                    "config": {"default_vlan": 1, "ports": []},
                },
                {
                    "id": "pc-100",
                    "type": "pc",
                    "position": {"x": 50, "y": 50},
                    "label": "Workstation A",
                    "config": {"interfaces": [{"ip_address": "192.168.1.10", "cidr_prefix": "24", "enabled": True}]},
                },
            ],
            "edges": [
                {
                    "id": "e-1",
                    "source": "pc-100",
                    "target": "sw-100",
                    "relationship_type": "connects",
                    "metadata": {},
                }
            ],
        },
    }
    res = client.post("/api/labs", json=payload)
    lab_id = res.json()["id"]

    # Export
    res_export = client.get(f"/api/labs/{lab_id}/export")
    assert res_export.status_code == 200
    exported_data = res_export.json()
    assert exported_data["name"] == "Exportable Network Lab"
    assert len(exported_data["graph_data"]["nodes"]) == 2

    # Import as a new lab
    exported_data["name"] = "Imported Network Clone"
    res_import = client.post("/api/labs/import", json=exported_data)
    assert res_import.status_code == 201
    imported_lab = res_import.json()
    assert imported_lab["id"] != lab_id
    assert imported_lab["name"] == "Imported Network Clone"
    assert imported_lab["node_count"] == 2


def test_import_validation_rejections(client):
    # Reject invalid node type (cloud resource should now be rejected!)
    bad_type_payload = {
        "name": "Bad Type",
        "graph_data": {
            "nodes": [
                {
                    "id": "x-1",
                    "type": "vpc",
                    "position": {"x": 0, "y": 0},
                    "label": "Deprecated Cloud VPC",
                    "config": {},
                }
            ],
            "edges": [],
        },
    }
    res = client.post("/api/labs/import", json=bad_type_payload)
    assert res.status_code == 400
    assert "Invalid node type" in res.json()["detail"]

    # Reject edge with nonexistent source
    bad_edge_source = {
        "name": "Bad Edge Source",
        "graph_data": {
            "nodes": [
                {
                    "id": "sw-1",
                    "type": "switch",
                    "position": {"x": 0, "y": 0},
                    "label": "Switch",
                    "config": {},
                }
            ],
            "edges": [
                {
                    "id": "e-bad",
                    "source": "nonexistent-node",
                    "target": "sw-1",
                    "relationship_type": "connects",
                }
            ],
        },
    }
    res2 = client.post("/api/labs/import", json=bad_edge_source)
    assert res2.status_code == 400
    assert "references nonexistent node" in res2.json()["detail"]


def test_scan_api_flow(client):
    # Create lab with network misconfigurations
    payload = {
        "name": "Vulnerable Network Lab",
        "graph_data": {
            "nodes": [
                {
                    "id": "fw-insecure",
                    "type": "firewall",
                    "position": {"x": 0, "y": 0},
                    "label": "Permissive Perimeter FW",
                    "config": {
                        "default_inbound_action": "allow",
                    },
                },
                {
                    "id": "srv-insecure",
                    "type": "server",
                    "position": {"x": 100, "y": 100},
                    "label": "Legacy Telnet Server",
                    "config": {
                        "ip_address": "10.0.0.10",
                        "default_gateway": "",
                        "services": [{"name": "Telnet", "port": 23, "protocol": "tcp", "enabled": True}],
                    },
                },
            ],
            "edges": [],
        },
    }
    res = client.post("/api/labs", json=payload)
    lab_id = res.json()["id"]

    # Run scan
    res_scan = client.post(f"/api/labs/{lab_id}/scan")
    assert res_scan.status_code == 200
    scan_result = res_scan.json()
    assert scan_result["total_rules"] == 8
    assert scan_result["failed"] >= 2  # FIREWALL_DEFAULT_ALLOW + SERVER_PLAINTEXT_PORT + HOST_MISSING_DEFAULT_GATEWAY
    assert len(scan_result["findings"]) >= 2
    rule_ids = [f["rule_id"] for f in scan_result["findings"]]
    assert "FIREWALL_DEFAULT_ALLOW" in rule_ids
    assert "SERVER_PLAINTEXT_PORT" in rule_ids

    # Check scan history endpoint
    res_scans = client.get(f"/api/labs/{lab_id}/scans")
    assert res_scans.status_code == 200
    scans_list = res_scans.json()
    assert len(scans_list) == 1
    assert scans_list[0]["total_rules"] == 8
