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
            tool.onMouseUp = function (event) {
                clickedShape = undefined;
            };
            tool.activate();
            nodes.forEach(function (node, index, array) {
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

            let fromNode, toNode;
            links.forEach(function (link, index, linksArray) {
                nodes.forEach(function (node, index, array) {
                    if (node.id == link.source) {
                        fromNode = node;
                    }
                });

                nodes.forEach(function (node, index, array) {
                    if (node.id == link.target) {
                        toNode = node;
                    }
                });

                link.path = new Path([fromNode.circle.position, toNode.circle.position]);
                link.path.strokeColor = link.path.fillColor = pathColor;
                link.path.strokeWidth = Math.sqrt(link.value);
            });


            view.onFrame = function (event) {
                nodes.forEach(function (nodeOuter, index, nodesList) {
                    nodeOuter.force = new Point(0, 0);
                    // repel force
                    nodes.forEach(function (nodeInner, index, nodesList) {
                        if (nodeInner.id !== nodeOuter.id) {
                            let vector = nodeOuter.circle.position.subtract(nodeInner.circle.position);
                            vector.length = calculateRepulsionForce(vector.length);
                            nodeOuter.force = nodeOuter.force.add(vector);
                        }
                    });

                    links.forEach(function (link, index, array) {
                        if (link.source == nodeOuter.id) {
                            nodes.forEach(function (nodeInner, index, nodesList) {
                                if (nodeInner.id == link.target) {
                                    let vector = nodeInner.circle.position.subtract(nodeOuter.circle.position);
                                    vector.length = calculateAttractionForce(vector.length);
                                    nodeOuter.force = nodeOuter.force.add(vector);
                                }
                            });
                        }

                        if (link.target == nodeOuter.id) {
                            nodes.forEach(function (nodeInner, index, nodesList) {
                                if (nodeInner.id == link.source) {
                                    let vector = nodeInner.circle.position.subtract(nodeOuter.circle.position);
                                    vector.length = calculateAttractionForce(vector.length);
                                    nodeOuter.force = nodeOuter.force.add(vector);
                                }
                            });
                        }
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
                links.forEach(function (link, index, linksArray) {
                    nodes.forEach(function (node, index, array) {
                        if (node.id == link.source) {
                            fromNode = node;
                        }
                    });

                    nodes.forEach(function (node, index, array) {
                        if (node.id == link.target) {
                            toNode = node;
                        }
                    });

                    link.path.setSegments([fromNode.circle.position, toNode.circle.position]);
                });
            }
        });
    }
);