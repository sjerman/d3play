function generateUUID() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

$(function () {
    $.getJSON("data/sample.json", function (data) {

        var summary = {
            node_meta: [],
            link_meta: [],
            history: []
        };

        var apnodes = {},
            wlcnodes = {};

        summary.node_meta.push({
            id: "client",
            type: "client",
            props: [
                {
                    "k": "macAddress",
                    "v": data.macAddress
                }
                ]
        });

        //look at each history entry
        data.connectionHistory.forEach(function (o) {

            //bug???
            if (o.details === undefined || o.details.toAP === '') {
                return;
            }

            var t = {
                "s": o.startTime,
                "f": o.endTime,
                links: [],
                nodes: []
            };

            var apAnalysis = o.analysis.find(function (e) {
                return e.type === 'ap'
            });
            var wlcAnalysis = o.analysis.find(function (e) {
                return e.type === 'wlc'
            });

            if (apAnalysis === undefined || wlcAnalysis === undefined) {
                return;
            }

            t.nodes.push({
                id: 'client',
                status: o.status
            });

            var apId = "ap_" + o.details.toAP;
            var apNode;

            if (!(apId in apnodes)) {
                apNode = {
                    id: apId,
                    type: "ap",
                    props: [
                        {
                            'k': "macAddress",
                            'v': o.details.toAP
                        },
                        {
                            'k': "name",
                            'v': apAnalysis.name
                        }
                    ]
                };
                apnodes[apId] = apNode;
            } else {
                apNode = apnodes[apId];
            }
            apNode.status = apAnalysis.status;
            t.nodes.push(apNode);

            var wlcId = "wlc_" + wlcAnalysis.name;
            var wlcnode;
            if (!(wlcId in wlcnodes)) {
                wlcnode = {
                    id: wlcId,
                    type: "wlc",
                    props: [
                        {
                            'k': "ipAddress",
                            'v': wlcAnalysis.name
                        }
                    ]
                };
                wlcnodes[wlcId] = wlcnode;
            } else {
                wlcnode = wlcnodes[wlcId];
            }
            console.log(">>", wlcnode);
            wlcnode.status = wlcAnalysis.status;
            t.nodes.push(wlcnode);

            var linkId = apId + '-' + wlcId;
            var link = summary.link_meta.find(function (l) {
                return l.id === linkId;
            });
            if (!link) {
                summary.link_meta.push({
                    id: linkId,
                    props: [],
                    from: apId,
                    to: wlcId
                });
            }
            t.links.push({
                id: linkId,
                props: []
            });

            var clinkId = 'client-' + apId;
            var clink = summary.link_meta.find(function (l) {
                return l.id === clinkId;
            });
            if (!clink) {
                summary.link_meta.push({
                    id: clinkId,
                    props: [],
                    from: 'client',
                    to: apId
                });
            }
            t.links.push({
                id: clinkId,
                props: []
            });

            summary.history.push(t);

        });

        summary.node_meta = summary.node_meta.concat($.map(apnodes, function (v) {
            return v;
        }));
        summary.node_meta = summary.node_meta.concat($.map(wlcnodes, function (v) {
            return v;
        }));

        var jsonPretty = JSON.stringify(summary, null, '\t');
        $("pre").text(jsonPretty);
    });
});