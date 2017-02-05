/**
 * Created by ctknight on 2017/1/23.
 */
paper.install(window);

$(document).ready(
    function () {
        paper.setup('myCanvas');
        const radius = 5;
        const canvasSize = 500;
        // following algorithm are from A heuristic for graph drawing by Eades in 1984
        // but I adjusted the constants to adapt the canvas
        const C1 = 3.0, C2 = 30.0, C3 = 0.5, C4 = 1.0;
        const pathColor = new Color(0.6, 0.6, 0.6, 0.4);

        // load data from json
        $.getJSON('js/miserables.json', function (data) {
            let nodes = data.nodes;
            let links = data.links;

            let clickedShape;
            let tool = new Tool();
            // when mouse is no longer click on the shape, release.
            tool.onMouseUp = function () {
                clickedShape = undefined;
            };
            tool.activate();
            nodes.forEach(function (node) {
                // randomize the initial position
                node.circle = new Shape.Circle(Point.random().multiply(canvasSize), radius);
                node.circle.strokeColor = 'white';
                node.circle.fillColor = new Color({hue: node.group * 30, saturation: 0.7, brightness: 0.9});
                node.circle.onMouseDown = function (event) {
                    this.position = event.point;
                    clickedShape = this;
                };
                node.circle.onMouseDrag = function (event) {
                    this.position = event.point;
                    clickedShape = this;
                };
            });

            updatePath(links, nodes);

            view.onFrame = function () {
                nodes.forEach(function (nodeOuter) {
                    nodeOuter.force = new Point(0, 0);
                    // repel force
                    nodes.filter((node) => node.id !== nodeOuter.id)
                        .forEach(function (nodeInner) {
                            let vector = nodeOuter.circle.position.subtract(nodeInner.circle.position);
                            vector.length = calculateRepulsionForce(vector.length);
                            nodeOuter.force = nodeOuter.force.add(vector);
                        });

                    links.filter((link) => link.source === nodeOuter.id)
                        .forEach(function (link) {
                            nodes.filter((node) => node.id === link.target)
                                .forEach(function (nodeInner) {
                                    let vector = nodeInner.circle.position.subtract(nodeOuter.circle.position);
                                    vector.length = calculateAttractionForce(vector.length);
                                    nodeOuter.force = nodeOuter.force.add(vector);
                                });
                        });

                    links.filter((link) => link.target === nodeOuter.id)
                        .forEach(function (link) {
                            nodes.filter((node) => node.id == link.source)
                                .forEach(function (nodeInner) {
                                    let vector = nodeInner.circle.position.subtract(nodeOuter.circle.position);
                                    vector.length = calculateAttractionForce(vector.length);
                                    nodeOuter.force = nodeOuter.force.add(vector);
                                });
                        });
                    // if the shape is clicked, just leave it there and let mouse control its position
                    if (nodeOuter.circle !== clickedShape) {
                        nodeOuter.circle.position = nodeOuter.circle.position.add(nodeOuter.force.multiply(C4));
                    }
                });
                updatePath(links, nodes);
            };

            function calculateAttractionForce(distance) {
                return C1 * Math.log(distance / C2);
            }

            function calculateRepulsionForce(distance) {
                return C3 / Math.sqrt(distance);
            }

            function updatePath(links, nodes) {
                let fromNode, toNode;
                links.forEach(function (link) {
                    nodes.filter((node) => node.id == link.source)
                        .forEach(function (node) {
                            fromNode = node;
                        });

                    nodes.filter((node) => node.id == link.target)
                        .forEach(function (node) {
                            toNode = node;
                        });

                    // init
                    if (link.path === undefined) {
                        link.path = new Path([fromNode.circle.position, toNode.circle.position]);
                        link.path.strokeColor = link.path.fillColor = pathColor;
                        link.path.strokeWidth = Math.sqrt(link.value);
                    } else {
                        link.path.setSegments([fromNode.circle.position, toNode.circle.position]);
                    }
                });

            }
        });
    }
);