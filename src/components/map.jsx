import React, { Component } from "react";
import ReactMapGL, { Marker, NavigationControl, Popup } from "react-map-gl";
import WebMercatorViewport from "viewport-mercator-project";

import { settings } from "../helpers/settings";
import Link from "./link";

export default class Map extends Component {
  constructor() {
    super();
    this.state = {
      bounds: {},
      locations: {},
      locations_keys: [],
      popup: true,
      viewport: new WebMercatorViewport()
    };
    //need this for changes to the viewport, eg panning, zooming, resizing
    this.updateViewport = this.updateViewport.bind(this);
  }

  updateViewport(viewport) {
    //need this for changes to the viewport, eg panning + zooming
    this.setState({ viewport: viewport });
  }

  resetMapBounds() {
    //filter & sort meetings so southern pins are in front
    const meetings = this.props.state.meetings
      .filter(meeting => {
        return this.props.filteredSlugs.indexOf(meeting.slug) !== -1;
      })
      .sort((a, b) => {
        return b.latitude - a.latitude;
      });

    //reset bounds
    // all below were changes from to avoid directly mutating stater
    this.setState({ ...this.state, locations: {} });
    this.setState({ ...this.state, locations_keys: [] });
    this.setState({ ...this.state, bounds: {} });

    //build index of map pins and define bounds
    for (let i = 0; i < meetings.length; i++) {
      let meeting = meetings[i];

      if (meeting.latitude && meeting.latitude) {
        let coords = meeting.longitude + "," + meeting.latitude;
        meeting.latitude = parseFloat(meeting.latitude);
        meeting.longitude = parseFloat(meeting.longitude);

        //create a new pin
        if (this.state.locations_keys.indexOf(coords) === -1) {
          this.state.locations_keys.push(coords);
          this.setState({
            ...this.state,
            locations: {
              coords: {
                name: meeting.location,
                formatted_address: meeting.formatted_address,
                latitude: meeting.latitude,
                longitude: meeting.longitude,
                //probably a directions link here
                meetings: []
              }
            }
          });
          // this.state.locations[coords] = {
          //   name: meeting.location,
          //   formatted_address: meeting.formatted_address,
          //   latitude: meeting.latitude,
          //   longitude: meeting.longitude,
          //   //probably a directions link here
          //   meetings: [],
          // };
        }

        //expand bounds
        if (
          !this.state.bounds.north ||
          meeting.latitude > this.state.bounds.north
        )
          this.setState({ ...this.state, bounds: { north: meeting.latitude } });
        if (
          !this.state.bounds.south ||
          meeting.latitude < this.state.bounds.south
        )
          this.setState({ ...this.state, bounds: { south: meeting.latitude } });
        if (
          !this.state.bounds.east ||
          meeting.longitude > this.state.bounds.east
        )
          this.setState({ ...this.state, bounds: { east: meeting.longitude } });
        if (
          !this.state.bounds.west ||
          meeting.longitude < this.state.bounds.west
        )
          this.setState({ ...this.state, bounds: { west: meeting.longitude } });

        //add meeting to pin
        this.state.locations[coords].meetings.push(meeting);
      }
    }

    //make the viewport
    if (this.state.bounds.west === this.state.bounds.east) {
      //single marker
      this.setState({
        ...this.state,
        viewport: {
          latitude: this.state.bounds.north,
          longitude: this.state.bounds.west,
          zoom: 14
        }
      });
      // this.state.viewport = {
      //   latitude: this.state.bounds.north,
      //   longitude: this.state.bounds.west,
      //   zoom: 14
      // };
    } else {
      //calculate bounds now knowing dimensions
      //setTimeout seems to be unfortunately necessary to render properly (todo try removing)
      setTimeout(() => {
        this.setState({
          viewport: new WebMercatorViewport({
            width: this.state.viewport.width,
            height: this.state.viewport.height
          }).fitBounds(
            [
              [this.state.bounds.west, this.state.bounds.south],
              [this.state.bounds.east, this.state.bounds.north]
            ],
            {
              padding:
                Math.min(
                  this.state.viewport.width,
                  this.state.viewport.height
                ) / 10
            }
          )
        });
      });
    }
  }

  render() {
    //reset the map bounds if necessary
    if (!this.props.state.map_initialized) {
      this.resetMapBounds();
      this.props.setMapInitialized(); //report that bounds are set
    }

    return (
      <div className="border rounded bg-light flex-grow-1 map">
        {this.state.viewport && (
          <ReactMapGL
            {...this.state.viewport}
            mapboxApiAccessToken={settings.keys.mapbox}
            mapStyle={settings.mapbox_style}
            onViewportChange={this.updateViewport}
            style={{ position: "absolute" }}
            width="100%"
            height="100%"
          >
            {this.state.locations_keys.map(key => {
              const location = this.state.locations[key];
              return (
                <div key={key}>
                  <Marker
                    latitude={location.latitude}
                    longitude={location.longitude}
                    offsetLeft={-settings.marker_style.width / 2}
                    offsetTop={-settings.marker_style.height}
                  >
                    <div
                      title={location.name}
                      style={settings.marker_style}
                      onClick={() => this.setState({ popup: key })}
                    />
                  </Marker>
                  {this.state.popup === key && (
                    <Popup
                      latitude={location.latitude}
                      longitude={location.longitude}
                      className="popup"
                      onClose={() => this.setState({ popup: null })}
                      offsetTop={-settings.marker_style.height}
                    >
                      <h4 className="font-weight-light">{location.name}</h4>
                      <p>{location.formatted_address}</p>
                      <ul className="list-group mb-3">
                        {location.meetings.map(meeting => {
                          return (
                            <li key={meeting.slug} className="list-group-item">
                              <time>{meeting.formatted_time}</time>
                              <Link
                                meeting={meeting}
                                state={this.props.state}
                                setAppState={this.props.setAppState}
                              />
                            </li>
                          );
                        })}
                      </ul>
                      <button className="btn btn-outline-secondary btn-block">
                        Directions
                      </button>
                    </Popup>
                  )}
                </div>
              );
            })}
            <div className="control">
              <NavigationControl
                showCompass={false}
                onViewportChange={this.updateViewport}
              />
            </div>
          </ReactMapGL>
        )}
      </div>
    );
  }
}
